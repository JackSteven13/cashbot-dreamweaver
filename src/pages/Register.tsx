
import { useRegistration } from '@/hooks/auth/useRegistration';
import RegistrationPageLayout from '@/components/auth/RegistrationPageLayout';
import RegistrationForm from '@/components/auth/RegistrationForm';

const Register = () => {
  const { handleSuccessfulRegistration } = useRegistration();

  return (
    <RegistrationPageLayout
      title="Créez votre compte"
      subtitle="Rejoignez des milliers d'utilisateurs qui génèrent des revenus passifs"
    >
      <RegistrationForm onSuccessfulRegistration={handleSuccessfulRegistration} />
    </RegistrationPageLayout>
  );
};

export default Register;
