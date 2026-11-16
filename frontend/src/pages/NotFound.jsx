import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';

function NotFound() {
  return (
    <>
      <Navbar />
      <main className="page-center">
        <h1>Page not found</h1>
        <p className="text-muted">The page you are looking for does not exist.</p>
        <Button to="/">Go home</Button>
      </main>
      <Footer />
    </>
  );
}

export default NotFound;
