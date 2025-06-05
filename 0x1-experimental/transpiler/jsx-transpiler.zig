const std = @import("std");
const print = std.debug.print;
const Allocator = std.mem.Allocator;

// === JSX TRANSPILER FOR 0x1 FRAMEWORK (Zig 0.15.0-dev) ===
//
// This transpiler converts JSX syntax to 0x1-compatible JavaScript/TypeScript
// Optimized for speed and minimal overhead, based on the Node.js implementation.
//
// Example transformations:
// <div>Hello</div> → createElement('div', null, 'Hello')
// <Button onClick={handler}>Click</Button> → createElement(Button, {onClick: handler}, 'Click')

const JSXToken = enum {
    Text,
    OpenTag,
    CloseTag,
    SelfClosingTag,
    JavaScript,
    EOF,
};

const JSXNode = struct {
    tag: []const u8,
    props: std.ArrayList(Prop),
    children: std.ArrayList(*JSXNode),
    content: ?[]const u8,
    is_component: bool,
    allocator: Allocator,

    const Prop = struct {
        name: []const u8,
        value: []const u8,
        is_expression: bool,
    };

    pub fn init(allocator: Allocator, tag: []const u8) !*JSXNode {
        const node = try allocator.create(JSXNode);
        node.* = JSXNode{
            .tag = tag,
            .props = std.ArrayList(Prop).init(allocator),
            .children = std.ArrayList(*JSXNode).init(allocator),
            .content = null,
            .is_component = isComponent(tag),
            .allocator = allocator,
        };
        return node;
    }

    pub fn deinit(self: *JSXNode) void {
        self.props.deinit();
        for (self.children.items) |child| {
            child.deinit();
            self.allocator.destroy(child);
        }
        self.children.deinit();
    }

    pub fn destroy(self: *JSXNode) void {
        self.deinit();
        self.allocator.destroy(self);
    }

    fn isComponent(tag: []const u8) bool {
        return tag.len > 0 and std.ascii.isUpper(tag[0]);
    }

    pub fn addProp(self: *JSXNode, name: []const u8, value: []const u8, is_expression: bool) !void {
        try self.props.append(Prop{
            .name = name,
            .value = value,
            .is_expression = is_expression,
        });
    }

    pub fn addChild(self: *JSXNode, child: *JSXNode) !void {
        try self.children.append(child);
    }
};

const JSXTranspiler = struct {
    source: []const u8,
    pos: usize,
    allocator: Allocator,
    
    pub fn init(allocator: Allocator, source: []const u8) JSXTranspiler {
        return JSXTranspiler{
            .source = source,
            .pos = 0,
            .allocator = allocator,
        };
    }

    pub fn transpile(self: *JSXTranspiler) ![]u8 {
        var output = std.ArrayList(u8).init(self.allocator);
        defer output.deinit();

        while (self.pos < self.source.len) {
            if (self.peek() == '<' and !self.isInJSExpression()) {
                const node = try self.parseJSXElement();
                try self.renderNode(&output, node);
                node.destroy();
            } else {
                try output.append(self.advance());
            }
        }

        return output.toOwnedSlice();
    }

    fn parseJSXElement(self: *JSXTranspiler) !*JSXNode {
        self.skipWhitespace();
        
        if (self.peek() != '<') {
            return error.ExpectedOpenBracket;
        }
        _ = self.advance(); // consume '<'

        const tag = try self.parseTagName();
        const node = try JSXNode.init(self.allocator, tag);

        // Parse attributes
        while (self.pos < self.source.len and self.peek() != '>' and self.peek() != '/') {
            self.skipWhitespace();
            if (self.peek() == '>' or self.peek() == '/') break;
            
            try self.parseAttribute(node);
        }

        self.skipWhitespace();

        // Check for self-closing tag
        if (self.peek() == '/') {
            _ = self.advance(); // consume '/'
            if (self.peek() != '>') {
                return error.ExpectedCloseBracket;
            }
            _ = self.advance(); // consume '>'
            return node;
        }

        if (self.peek() != '>') {
            return error.ExpectedCloseBracket;
        }
        _ = self.advance(); // consume '>'

        // Parse children until closing tag
        while (self.pos < self.source.len) {
            self.skipWhitespace();
            
            if (self.pos + 1 < self.source.len and 
                self.source[self.pos] == '<' and 
                self.source[self.pos + 1] == '/') {
                // Found closing tag
                break;
            }

            if (self.peek() == '<') {
                // Nested JSX element
                const child = try self.parseJSXElement();
                try node.addChild(child);
            } else if (self.peek() == '{') {
                // JavaScript expression
                const expr = try self.parseJSExpression();
                const text_node = try JSXNode.init(self.allocator, "");
                text_node.content = expr;
                try node.addChild(text_node);
            } else {
                // Text content
                const text = try self.parseTextContent();
                if (text.len > 0) {
                    const text_node = try JSXNode.init(self.allocator, "");
                    text_node.content = text;
                    try node.addChild(text_node);
                }
            }
        }

        // Parse closing tag
        try self.parseClosingTag(tag);

        return node;
    }

    fn parseTagName(self: *JSXTranspiler) ![]const u8 {
        const start = self.pos;
        while (self.pos < self.source.len and 
               (std.ascii.isAlphanumeric(self.peek()) or self.peek() == '-' or self.peek() == '_')) {
            _ = self.advance();
        }
        return self.source[start..self.pos];
    }

    fn parseAttribute(self: *JSXTranspiler, node: *JSXNode) !void {
        const name = try self.parseAttributeName();
        self.skipWhitespace();

        if (self.peek() != '=') {
            // Boolean attribute
            try node.addProp(name, "true", false);
            return;
        }

        _ = self.advance(); // consume '='
        self.skipWhitespace();

        var value: []const u8 = undefined;
        var is_expression = false;

        if (self.peek() == '"' or self.peek() == '\'') {
            // String literal
            const quote = self.advance();
            const start = self.pos;
            while (self.pos < self.source.len and self.peek() != quote) {
                _ = self.advance();
            }
            value = self.source[start..self.pos];
            _ = self.advance(); // consume closing quote
        } else if (self.peek() == '{') {
            // JavaScript expression
            value = try self.parseJSExpression();
            is_expression = true;
        } else {
            return error.InvalidAttributeValue;
        }

        try node.addProp(name, value, is_expression);
    }

    fn parseAttributeName(self: *JSXTranspiler) ![]const u8 {
        const start = self.pos;
        while (self.pos < self.source.len and 
               (std.ascii.isAlphanumeric(self.peek()) or self.peek() == '-' or self.peek() == '_' or self.peek() == ':')) {
            _ = self.advance();
        }
        return self.source[start..self.pos];
    }

    fn parseJSExpression(self: *JSXTranspiler) ![]const u8 {
        if (self.peek() != '{') {
            return error.ExpectedOpenBrace;
        }
        _ = self.advance(); // consume '{'

        const start = self.pos;
        var brace_count: i32 = 1;

        while (self.pos < self.source.len and brace_count > 0) {
            const ch = self.advance();
            if (ch == '{') {
                brace_count += 1;
            } else if (ch == '}') {
                brace_count -= 1;
            }
        }

        return self.source[start..self.pos - 1]; // exclude closing '}'
    }

    fn parseTextContent(self: *JSXTranspiler) ![]const u8 {
        const start = self.pos;
        while (self.pos < self.source.len and self.peek() != '<' and self.peek() != '{') {
            _ = self.advance();
        }
        return std.mem.trim(u8, self.source[start..self.pos], " \t\n\r");
    }

    fn parseClosingTag(self: *JSXTranspiler, expected_tag: []const u8) !void {
        if (self.pos + 1 >= self.source.len or 
            self.source[self.pos] != '<' or 
            self.source[self.pos + 1] != '/') {
            return error.ExpectedClosingTag;
        }

        _ = self.advance(); // consume '<'
        _ = self.advance(); // consume '/'

        const tag = try self.parseTagName();
        if (!std.mem.eql(u8, tag, expected_tag)) {
            return error.MismatchedClosingTag;
        }

        self.skipWhitespace();
        if (self.peek() != '>') {
            return error.ExpectedCloseBracket;
        }
        _ = self.advance(); // consume '>'
    }

    fn renderNode(self: *JSXTranspiler, output: *std.ArrayList(u8), node: *JSXNode) !void {
        if (node.tag.len == 0 and node.content != null) {
            // Text node
            if (std.mem.indexOf(u8, node.content.?, "${") != null or 
                std.mem.indexOf(u8, node.content.?, "{") != null) {
                // JavaScript expression
                try output.appendSlice(node.content.?);
            } else {
                // String literal
                try output.appendSlice("'");
                try output.appendSlice(node.content.?);
                try output.appendSlice("'");
            }
            return;
        }

        // JSX element → createElement call
        try output.appendSlice("createElement(");

        // Component name or tag
        if (node.is_component) {
            try output.appendSlice(node.tag);
        } else {
            try output.appendSlice("'");
            try output.appendSlice(node.tag);
            try output.appendSlice("'");
        }

        // Props object
        if (node.props.items.len > 0) {
            try output.appendSlice(", {");
            for (node.props.items, 0..) |prop, i| {
                if (i > 0) try output.appendSlice(", ");
                
                try output.appendSlice(prop.name);
                try output.appendSlice(": ");
                
                if (prop.is_expression) {
                    try output.appendSlice(prop.value);
                } else {
                    try output.appendSlice("'");
                    try output.appendSlice(prop.value);
                    try output.appendSlice("'");
                }
            }
            try output.appendSlice("}");
        } else {
            try output.appendSlice(", null");
        }

        // Children
        if (node.children.items.len > 0) {
            for (node.children.items) |child| {
                try output.appendSlice(", ");
                try self.renderNode(output, child);
            }
        }

        try output.appendSlice(")");
    }

    fn peek(self: *JSXTranspiler) u8 {
        if (self.pos >= self.source.len) return 0;
        return self.source[self.pos];
    }

    fn advance(self: *JSXTranspiler) u8 {
        if (self.pos >= self.source.len) return 0;
        const ch = self.source[self.pos];
        self.pos += 1;
        return ch;
    }

    fn skipWhitespace(self: *JSXTranspiler) void {
        while (self.pos < self.source.len and std.ascii.isWhitespace(self.peek())) {
            _ = self.advance();
        }
    }

    fn isInJSExpression(self: *JSXTranspiler) bool {
        // Simple heuristic - could be improved
        var temp_pos = self.pos;
        var brace_count: i32 = 0;
        
        while (temp_pos > 0) {
            temp_pos -= 1;
            if (self.source[temp_pos] == '}') {
                brace_count += 1;
            } else if (self.source[temp_pos] == '{') {
                brace_count -= 1;
            }
        }
        
        return brace_count > 0;
    }
};

// === CLI INTERFACE FOR TESTING ===
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    if (args.len < 2) {
        print("Usage: zig run jsx-transpiler.zig -- <jsx-file>\n", .{});
        print("\nExample JSX to test:\n", .{});
        print("<div className=\"container\">\n", .{});
        print("  <h1>Hello 0x1!</h1>\n", .{});
        print("  <Button onClick={{handleClick}}>Click me</Button>\n", .{});
        print("</div>\n", .{});
        return;
    }

    const file_path = args[1];
    const jsx_content = std.fs.cwd().readFileAlloc(allocator, file_path, 1024 * 1024) catch |err| {
        print("❌ Error reading file '{s}': {any}\n", .{ file_path, err });
        return;
    };
    defer allocator.free(jsx_content);

    print("🔥 0x1 JSX Transpiler\n", .{});
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", .{});
    print("📄 Input file: {s}\n\n", .{file_path});

    var transpiler = JSXTranspiler.init(allocator, jsx_content);
    const result = transpiler.transpile() catch |err| {
        print("❌ Transpilation error: {any}\n", .{err});
        return;
    };
    defer allocator.free(result);

    print("✨ Transpiled output:\n", .{});
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", .{});
    print("{s}\n", .{result});
    print("\n🚀 Transpilation completed!\n", .{});
}

// === WHAT THIS DEMONSTRATES ===
//
// 1. **High-Performance JSX Parsing**: Manual lexing and parsing in Zig
// 2. **0x1-Specific Output**: Generates createElement calls optimized for 0x1
// 3. **Memory Efficiency**: Controlled allocation and deallocation
// 4. **Component Detection**: Distinguishes between HTML tags and React components
// 5. **Expression Handling**: Processes JavaScript expressions in JSX
// 6. **Extensible Design**: Easy to add more JSX features and optimizations
//
// Performance benefits over JavaScript transpilers:
// - No GC overhead
// - Compile-time optimizations
// - Direct memory management
// - Potential for ahead-of-time compilation 