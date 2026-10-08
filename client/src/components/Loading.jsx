import './Loading.css';

function Loading({ text }) {
  return (
    <div className="loading-wrap">
      <div style={{ textAlign: 'center' }}>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
        {text && <p style={{ marginTop: '1rem', color: '#6b6b63' }}>{text}</p>}
      </div>
    </div>
  );
}

export default Loading;