// Full-page spinner while something loads.
function Loader({ text = 'Loading...' }) {
  return (
    <div className="page-center">
      <span className="spinner" aria-hidden="true" />
      <p className="text-muted">{text}</p>
    </div>
  );
}

export default Loader;
