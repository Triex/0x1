/**
 * Demo JSX file for testing the transpiler
 */

function DemoComponent({ title, items }) {
  return (
    <div className="container">
      <h1>{title}</h1>
      <ul>
        {items.map(item => (
          <li key={item.id} className={item.active ? 'active' : ''}>
            {item.name}
          </li>
        ))}
      </ul>
      <Button onClick={() => console.log('Clicked!')}>
        Click me!
      </Button>
    </div>
  );
}

// A simple component with props
function Button({ children, onClick }) {
  return (
    <button 
      className="btn primary" 
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Export the component
export default DemoComponent;
