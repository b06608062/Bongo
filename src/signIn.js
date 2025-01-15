import { Input, Button, Typography, Form } from "antd";
import { UserOutlined, CloseCircleFilled } from "@ant-design/icons";
import styled from "styled-components";
import { useState } from "react";
import { SIGN_IN_MUTATION, SIGN_UP_MUTATION } from "./graphql";
import { useMutation } from "@apollo/react-hooks";
import displayStatus from "./displayStatus";

const { Title } = Typography;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;
  width: 100%;
  height: 100vh;
  background: linear-gradient(to top, #08105a, #0612bd, #0ac7e9);
  overflow: auto;
  .RWD {
    width: 300px;
  }
  @media screen and (max-height: 350px) {
    .logo {
      display: none;
    }
    .sign-up {
      display: none;
    }
    .forget {
      display: none;
    }
    .dash {
      display: none;
    }
  }

  @media screen and (max-height: 250px) {
    .RWD {
      width: 200px;
    }
  }
`;

const SignInButton = styled(Button)`
  width: 300px;
  margin-bottom: 5px;
  background: #096dd9;
  border-color: #096dd9;
  font-weight: bolder;
  &:hover {
    background: #1890ff;
    border-color: #1890ff;
  }
  &: focus {
    background: #1890ff;
    border-color: #1890ff;
  }
`;

const SignUpButton = styled.div`
  width: 150px;
  height: 40px;
  display: block;
  text-align: center;
  cursor: pointer;
  line-height: 40px;
  color: white;
  background-color: transparent;
  border: 1px solid #fff;
  position: relative;
  font-weight: bolder;
  margin-top: 20px;
  &:hover {
    transform: scale(1.05, 1.05);
  }
`;

const Mask = styled.div`
  position: absolute;
  top: 0%;
  left: 0%;
  display: none;
  z-index: 1001;
  width: 100%;
  height: 100%;
  background-color: #00000050;
  @media screen and (max-height: 280px) {
    display: none !important;
  }
`;

const SignUpModal = styled.div`
  position: absolute;
  top: calc((100vh - 250px) / 2.5);
  display: none;
  z-index: 1002;
  width: 300px;
  height: 250px;
  padding: 8px;
  background-color: white;
  @media screen and (max-height: 280px) {
    display: none !important;
    .sign-up-title {
      display: none;
    }
  }
`;

const SignUpSubmitButton = styled(Button)`
  background: #096dd9;
  border-color: #096dd9;
  &:hover {
    background: #1890ff;
    border-color: #1890ff;
  }
  &: focus {
    background: #1890ff;
    border-color: #1890ff;
  }
`;

const SignIn = ({ me, setMe, setOnline }) => {
  const [openModal, setOpenModal] = useState(false);
  const [password, setPassword] = useState("");
  const [signIn] = useMutation(SIGN_IN_MUTATION);
  const [signUp] = useMutation(SIGN_UP_MUTATION);

  const handleSignIn = () => {
    if (!me) {
      displayStatus({ type: "error", msg: "Missing username." });
    } else if (!password) {
      displayStatus({ type: "error", msg: "Missing password." });
    } else {
      signIn({
        variables: {
          userName: me,
          password,
        },
        onCompleted: ({ signIn }) => {
          if (signIn) {
            setOnline(true);
            displayStatus({ type: "success", msg: `${me}, Welcome to Bongo!` });
          } else {
            displayStatus({
              type: "error",
              msg: "Incorrect username or password.",
            });
          }
        },
      });
    }
  };

  const handleSignUp = ({ userName, password }) => {
    if (!userName || !password) return;
    if (userName.indexOf(" ") !== -1) {
      displayStatus({ type: "error", msg: "Invaild username." });
      return;
    }
    signUp({
      variables: {
        userName,
        password,
      },
      onCompleted: ({ createUser }) => {
        if (createUser) {
          setOpenModal(false);
          setMe(userName);
          displayStatus({
            type: "success",
            msg: "Your registration is successful!",
          });
        } else {
          displayStatus({
            type: "error",
            msg: `Username ${userName} is existed.`,
          });
        }
      },
    });
  };

  return (
    <Wrapper>
      <Title style={{ marginBottom: 15, color: "white" }} className="logo">
        Bongo
      </Title>
      <Input
        value={me}
        onChange={(e) => setMe(e.target.value)}
        size="large"
        placeholder="Enter your name"
        prefix={<UserOutlined />}
        style={{ marginBottom: 5 }}
        maxLength={50}
        className="RWD"
      />
      <Input.Password
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.code === "Enter") handleSignIn();
        }}
        size="large"
        placeholder="Input password"
        style={{ marginBottom: 5 }}
        maxLength={50}
        className="RWD"
      />
      <SignInButton type="primary" onClick={handleSignIn} className="RWD">
        Sign in
      </SignInButton>
      <Button type="link" className="forget">
        忘記密碼
      </Button>
      <hr
        style={{ border: "1px dashed #BEBEBE", width: 300 }}
        className="dash"
      ></hr>
      <SignUpButton onClick={() => setOpenModal(true)} className="sign-up">
        Sign up
      </SignUpButton>
      <Mask style={{ display: openModal ? "block" : "none" }} />
      <SignUpModal style={{ display: openModal ? "block" : "none" }}>
        <h1 className="sign-up-title">快速註冊</h1>
        <CloseCircleFilled
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}
          onClick={() => setOpenModal(false)}
        />
        <Form
          onFinish={handleSignUp}
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          initialValues={{
            remember: true,
          }}
          autoComplete="off"
        >
          <Form.Item
            label="username"
            name="userName"
            rules={[
              {
                required: true,
                message: "Please input your username!",
              },
            ]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            label="password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password maxLength={50} />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <SignUpSubmitButton type="primary" htmlType="submit">
              Submit
            </SignUpSubmitButton>
          </Form.Item>
        </Form>
      </SignUpModal>
    </Wrapper>
  );
};

export default SignIn;
