import React from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { users } from "./users.jsx"; // 🔹 umumiy fayldan import

const Login = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const onFinish = (values) => {
        const found = users.find(
            (u) => u.login === values.login && u.parol === values.parol
        );

        if (found) {
            const userData = {
                username: found.username,
                login: found.login,
                parol: found.parol,
                loginTime: new Date().toISOString(),
            };

            localStorage.setItem("userData", JSON.stringify(userData));
            sessionStorage.setItem("userData", JSON.stringify(userData)); // ✅ zaxira

            message.success(`Xush kelibsiz, ${found.username}!`);
            navigate("/");
        } else {
            message.error("Login yoki parol noto‘g‘ri!");
        }
    };

    return (
        <div
            style={{
                maxWidth: 350,
                margin: "100px auto",
                padding: 24,
                borderRadius: 12,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                background: "#fff",
            }}
        >
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>🔐 Login</h2>

            <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
                <Form.Item
                    label="Login"
                    name="login"
                    rules={[{ required: true, message: "Loginni kiriting!" }]}
                >
                    <Input placeholder="Login" />
                </Form.Item>

                <Form.Item
                    label="Parol"
                    name="parol"
                    rules={[{ required: true, message: "Parolni kiriting!" }]}
                >
                    <Input.Password placeholder="Parol" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    Kirish
                </Button>
            </Form>
        </div>
    );
};

export default Login;
