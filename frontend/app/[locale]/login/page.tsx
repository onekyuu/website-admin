import { FC } from "react";
import LoginPage from "./login-page";
import Layout from "@/components/Layout";

interface LoginProps {}

const Login: FC<LoginProps> = () => {
  return (
    <Layout>
      <LoginPage />
    </Layout>
  );
};

export default Login;
