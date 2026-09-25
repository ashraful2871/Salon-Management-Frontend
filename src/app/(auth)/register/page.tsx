import RegisterForm from "@/components/Auth/RegisterForm";
import { getAuthProviders } from "@/services/auth/getAuthProviders";

/** Signed-in visitors are turned away by the proxy; see the note in the login page. */
const RegisterPage = async () => {
  const providers = await getAuthProviders();

  return (
    <>
      <RegisterForm googleEnabled={providers.google} />
    </>
  );
};

export default RegisterPage;
