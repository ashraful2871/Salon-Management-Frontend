import RegisterForm from "@/components/Auth/RegisterForm";

/** Signed-in visitors are turned away by the proxy; see the note in the login page. */
const RegisterPage = () => {
  return (
    <>
      <RegisterForm />
    </>
  );
};

export default RegisterPage;
