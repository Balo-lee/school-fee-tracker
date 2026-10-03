function DirectorDashboard() {
  const name = localStorage.getItem('name');
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, {name}</h1>
      <p>Director dashboard coming soon.</p>
    </div>
  );
}

export default DirectorDashboard;