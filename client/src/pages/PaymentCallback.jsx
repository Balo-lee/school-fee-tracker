import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './Login.css';

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const reference = searchParams.get('reference');

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        {checking ? (
          <>
            <h2>Confirming your payment...</h2>
            <p className="tagline">Please wait a moment while we verify this with Paystack.</p>
          </>
        ) : (
          <>
            <h2>Payment Submitted ✅</h2>
            <p className="tagline">
              Your payment is being processed. It may take a few seconds to reflect.
              Reference: {reference}
            </p>
            <Link to="/dashboard/parent" className="btn-primary" style={{ textDecoration: 'none' }}>
              Back to My Children
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentCallback;