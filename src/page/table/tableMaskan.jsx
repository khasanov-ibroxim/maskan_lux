import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, message, Row, Col } from "antd";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNI-UT1oC5-RggH-WY3ZfPExh7vTw6fq22Q1FFzjKJ7-jaUF_9Dv-VS73wSXGfBl8/exec";
const { Option } = Select;

const TableMaskan = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // 🔹 1. Sahifa yuklanganda localStorage'dan oldingi xona turini olish
    useEffect(() => {
        const savedSheet = localStorage.getItem("selectedSheetName");
        if (savedSheet) {
            form.setFieldsValue({ sheetName: savedSheet });
        }
    }, [form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const xet = `${values.xona}/${values.etaj}/${values.etajnost}`;

            await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                mode: "no-cors",
                body: JSON.stringify({
                    sheetName: values.sheetName,
                    kvartil: values.kvartil,
                    xet: `'${xet}`,
                    tell: values.tell,
                }),
            });

            message.success("✅ Ma'lumot yuborildi!");
            form.resetFields();
            // Tanlangan xona turi o‘chmasin
            const savedSheet = localStorage.getItem("selectedSheetName");
            if (savedSheet) form.setFieldsValue({ sheetName: savedSheet });
        } catch (err) {
            console.error(err);
            message.error("❌ Yuborishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 2. Xona turi tanlanganda localStorage'ga saqlash
    const handleSheetChange = (value) => {
        localStorage.setItem("selectedSheetName", value);
        form.setFieldsValue({ sheetName: value });
    };

    return (
        <div
            style={{
                maxWidth: 450,
                margin: "40px auto",
                padding: 24,
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                background: "#fff",
            }}
        >
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>🏠 Uy ma'lumotlari</h2>

            <Form form={form}  autoComplete="off" layout="vertical" onFinish={onFinish}>
                {/* Xona turi */}
                <Form.Item
                    label="Xona turi"
                    name="sheetName"
                    rules={[{ required: true, message: "Xona turini tanlang!" }]}
                >
                    <Select placeholder="Xona turini tanlang" onChange={handleSheetChange}>
                        <Option value="1 xona">1 xona</Option>
                        <Option value="2 xona">2 xona</Option>
                        <Option value="3 xona">3 xona</Option>
                        <Option value="4 xona">4 xona</Option>
                        <Option value="5 xona">5 xona</Option>
                    </Select>
                </Form.Item>

                {/* Kvartil */}
                <Form.Item
                    label="Kvartil"
                    name="kvartil"
                    rules={[{ required: true, message: "Kvartilni tanlang!" }]}
                >
                    <Select placeholder="Kvartilni tanlang">
                        {[...Array(20)].map((_, i) => (
                            <Option key={i + 0} value={`Yunusobod - ${i + 0}`}>
                                Yunusobod - {i + 0}
                            </Option>
                        ))}
                        {[...Array(5)].map((_, i) => (
                            <Option key={i + 1} value={`Ц - ${i + 1}`}>
                                Ц - {i + 1}
                            </Option>
                        ))}
                        <Option  value={`Bodomzor`}>
                            Bodomzor
                        </Option>
                        <Option  value={`Minor`}>
                            Minor
                        </Option>
                    </Select>
                </Form.Item>

                {/* X/E/ET */}
                <Form.Item
                    label="X/E/ET (xona / etaj / etajnist)"
                    required

                >
                    <Input.Group compact style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Xona */}
                        <Form.Item
                            name="xona"
                            style={{ marginBottom: 0 }}
                            rules={[
                                { required: true, message: "Xona!" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const selected = getFieldValue("sheetName");
                                        if (!selected || !value) return Promise.resolve();

                                        const max = parseInt(selected); // masalan "3 xona" => 3
                                        const current = parseInt(value);

                                        if (isNaN(current)) {
                                            return Promise.reject("Faqat raqam kiriting!");
                                        }

                                        if (current > max) {
                                            return Promise.reject(`❌ ${selected} dan katta xona kiritmang!`);
                                        }
                                        if (current < max) {
                                            return Promise.reject(`❌ ${selected} dan kichik xona bo‘lmaydi!`);
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <Input
                                placeholder="2"
                                maxLength={2}
                                style={{ width: 60, textAlign: "center" }}
                            />
                        </Form.Item>

                        <span style={{ fontSize: 20, fontWeight: "bold" }}>/</span>

                        {/* Etaj */}
                        <Form.Item
                            name="etaj"
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: "Etaj!" }]}
                        >
                            <Input
                                placeholder="3"
                                maxLength={2}
                                style={{ width: 60, textAlign: "center" }}
                            />
                        </Form.Item>

                        <span style={{ fontSize: 20, fontWeight: "bold" }}>/</span>

                        {/* Etajnost */}
                        <Form.Item
                            name="etajnost"
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: "Etajnost!" }]}
                        >
                            <Input
                                placeholder="9"
                                maxLength={2}
                                style={{ width: 60, textAlign: "center" }}
                            />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>

                {/* Tell */}
                <Form.Item
                    label="Telefon raqami"
                    name="tell"
                    rules={[
                        { required: true, message: "Telefon raqamini kiriting!" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.reject("Telefon raqamini kiriting!");
                                // Faqat raqamlarni olib tashlab tekshiramiz
                                const digits = value.replace(/\D/g, "");
                                if (digits.length !== 12 || !digits.startsWith("998")) {
                                    return Promise.reject("To‘g‘ri raqam kiriting, masalan +998 90 123 45 67");
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder="+998 90 123 45 67"
                        maxLength={17}
                        autoComplete="off"
                        onChange={(e) => {
                            let input = e.target.value.replace(/\D/g, ""); // faqat raqamlar
                            if (!input.startsWith("998")) input = "998" + input; // har doim 998 bilan boshlansin

                            // 🔹 Formatlash
                            let formatted = "+998";
                            if (input.length > 3) formatted += " " + input.substring(3, 5);
                            if (input.length > 5) formatted += " " + input.substring(5, 8);
                            if (input.length > 8) formatted += " " + input.substring(8, 10);
                            if (input.length > 10) formatted += " " + input.substring(10, 12);

                            form.setFieldsValue({ tell: formatted });
                        }}
                    />
                </Form.Item>


                <Row justify="center">
                    <Col>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{
                                backgroundColor: "#1677ff",
                                borderRadius: 8,
                                padding: "0 30px",
                            }}
                        >
                            {loading ? "Yuborilmoqda..." : "Yuborish"}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default TableMaskan;
