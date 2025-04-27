
import React from 'react';

const DashboardFooter: React.FC = () => {
  return (
    <footer className="border-t py-4 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} Stream Genius. Tous droits réservés.</p>
    </footer>
  );
};

export default DashboardFooter;
