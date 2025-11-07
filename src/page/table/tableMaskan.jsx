import React, { useEffect, useState } from "react";
import {Form, Input, Button, Select, message, Row, Col, InputNumber} from "antd";
import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./tableMaskan.css"
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyTCM8bQD1iriXpa16Z146_xb5K6qY11new5i78Zgli6tPMYR4kCvOejsRG6pLCC3Y/exec";
const { Option } = Select;

const formatDateToDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    // isoDate: "YYYY-MM-DD"
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};


const TableMaskan = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const userData =
            localStorage.getItem("userData") || sessionStorage.getItem("userData");
        if (!userData) {
            message.warning("Iltimos, tizimga kiring!");
            window.location.href = "/login"; // yoki navigate("/login")
        }
    }, []);


    useEffect(() => {
        const savedSheet = localStorage.getItem("selectedSheetName");
        const savedSheetType = localStorage.getItem("selectedSheetType");
        if (savedSheet) {
            form.setFieldsValue({ sheetName: savedSheet });
            form.setFieldsValue({ sheetType: savedSheetType });
        }
    }, [form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const xet = `${values.xona}/${values.etaj}/${values.etajnost}`;

            // localStorage dan username ni olish
            const userData = localStorage.getItem("userData");
            let xodim = "";
            if (userData) {
                try {
                    const parsedData = JSON.parse(userData);
                    xodim = parsedData.username || "";
                } catch (e) {
                    console.error("userData parse error:", e);
                }
            }
            let osmotir = "";
            if (values.osmotir_sana || values.osmotir_vaqt) {
                const sana = values.osmotir_sana
                    ? formatDateToDDMMYYYY(values.osmotir_sana)
                    : "";
                const vaqt = values.osmotir_vaqt || "";
                osmotir = (sana + (sana && vaqt ? " " : "") + vaqt).trim();
            }
            const res = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                mode: "no-cors",
                body: JSON.stringify({
                    sheetName: values.sheetName,
                    sheetType: values.sheetType,
                    kvartil: values.kvartil,
                    xet: xet,  // ' belgisiz yuboramiz
                    tell: values.tell,
                    m2: values.m2 || "",
                    opisaniya: values.opisaniya || "",
                    narx: values.narx || "",
                    fio: values.fio || "",
                    id: values.id || "",
                    rieltor: values.rieltor,
                    sana: new Date().toLocaleDateString('ru-RU'),
                    xodim: xodim,
                    rasmlar: values.rasmlar || [],

                    uy_turi: values.uy_turi || "",
                    planirovka: values.planirovka || "",
                    xolati: values.xolati || "",
                    torets: values.torets || "",
                    balkon: values.balkon || "",
                    osmotir: osmotir || "",
                    dom: values.dom || "",
                    kvartira: values.kvartira || "",
                }),
            });

            if (res.status === 0) {
                message.success("✅ Ma'lumot yuborildi!");
                form.resetFields();
            } else if (res.status === 1) {
                message.error("❌ Yuborishda xatolik yuz berdi");
            }

            const savedSheet = localStorage.getItem("selectedSheetName");
            if (savedSheet) form.setFieldsValue({ sheetName: savedSheet });
        } catch (err) {
            console.error(err);
            message.error("❌ Yuborishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleSheetChange = (value) => {
        localStorage.setItem("selectedSheetName", value);
        form.setFieldsValue({ sheetName: value });
    };
    const handleSheetTypeChange = (value) => {
        localStorage.setItem("selectedSheetType", value);
        form.setFieldsValue({ sheetType: value });
    };

    return (
        <div
            style={{
                maxWidth: 500,
                margin: "40px auto",
                padding: 24,
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                background: "#fff",
            }}
        >
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>🏠 Uy ma'lumotlari</h2>

            <Form form={form} autoComplete="off" layout="vertical" onFinish={onFinish}>
                {/* Xona turi */}
                <Form.Item
                    label="Sotv yoki arenda"
                    name="sheetType"
                    rules={[{ required: true, message: "Xona turini tanlang!" }]}
                >
                    <Select placeholder="Xona turini tanlang" onChange={handleSheetTypeChange}>
                        <Option value="Sotuv">Sotuv</Option>
                        <Option value="Arenda">Arenda</Option>
                    </Select>
                </Form.Item>
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
                        <Option value={`Bodomzor`}>Bodomzor</Option>
                        <Option value={`Minor`}>Minor</Option>
                    </Select>
                </Form.Item>

                {/* X/E/ET */}
                <Form.Item label="X/E/ET (xona / etaj / etajnist)" required>
                    <Input.Group compact style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Form.Item
                            name="xona"
                            style={{ marginBottom: 0 }}
                            rules={[
                                { required: true, message: "Xona!" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const selected = getFieldValue("sheetName");
                                        if (!selected || !value) return Promise.resolve();

                                        const max = parseInt(selected);
                                        const current = parseInt(value);

                                        if (isNaN(current)) {
                                            return Promise.reject("Faqat raqam kiriting!");
                                        }

                                        if (current > max) {
                                            return Promise.reject(`❌ ${selected} dan katta xona kiritmang!`);
                                        }
                                        if (current < max) {
                                            return Promise.reject(`❌ ${selected} dan kichik xona bo'lmaydi!`);
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <Input placeholder="2" type={"tel"} maxLength={2} style={{ width: 60, textAlign: "center" }} />
                        </Form.Item>

                        <span style={{ fontSize: 20, fontWeight: "bold" }}>/</span>

                        <Form.Item
                            name="etaj"
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: "Etaj!" }]}
                        >
                            <Input placeholder="3" type="tel" maxLength={2} style={{ width: 60, textAlign: "center" }} />
                        </Form.Item>

                        <span style={{ fontSize: 20, fontWeight: "bold" }}>/</span>

                        <Form.Item
                            name="etajnost"
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: "Etajnost!" }]}
                        >
                            <Input placeholder="9" type="tel" maxLength={2} style={{ width: 60, textAlign: "center" }} />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>
                <Row gutter={20}>
                    <Col span={12}>
                        <Form.Item label="Dom" name="dom" >
                            <InputNumber max={150} style={{width:"100%"}} type={"number"} controls={false} placeholder={"1"}/>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Kvartira" name="kvartira" >
                            <InputNumber style={{width:"100%"}} type={"number"} controls={false}/>
                        </Form.Item>
                    </Col>
                </Row>
                {/* M² */}
                <Form.Item label="M² (Maydon)" name="m2"  rules={[{ required: true, message: "Balkon tanlang!" }]}>
                    <Input placeholder="65" type="tel" />
                </Form.Item>

                {/* Narx */}
                <Form.Item label="Narxi (USD)" name="narx"  rules={[{ required: true, message: "Narx yozin" }]}>
                    <Input
                        placeholder="75000"
                        style={{ width: "100%" }}
                        suffix="$"
                        controls={false}
                        type="tel"
                    />

                </Form.Item>
                {/* Telefon */}
                <Form.Item
                    label="Telefon raqami"
                    name="tell"
                    rules={[
                        { required: true, message: "Telefon raqamini kiriting!" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.reject("Telefon raqamini kiriting!");
                                const digits = value.replace(/\D/g, "");
                                if (digits.length !== 12 || !digits.startsWith("998")) {
                                    return Promise.reject("To'g'ri raqam kiriting, masalan +998 90 123 45 67");
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
                        type="tel"
                        onChange={(e) => {
                            let input = e.target.value.replace(/\D/g, "");
                            if (!input.startsWith("998")) input = "998" + input;

                            let formatted = "+998";
                            if (input.length > 3) formatted += " " + input.substring(3, 5);
                            if (input.length > 5) formatted += " " + input.substring(5, 8);
                            if (input.length > 8) formatted += " " + input.substring(8, 10);
                            if (input.length > 10) formatted += " " + input.substring(10, 12);

                            form.setFieldsValue({ tell: formatted });
                        }}
                    />
                </Form.Item>
                <Form.Item
                    label="Rielter"
                    name="rieltor"
                    rules={[{ required: true, message: "Rielter tanlang!" }]}
                >
                    <Select placeholder="Rielter tanlang">
                        <Option value="Rielter 1">Rielter 1</Option>
                        <Option value="Rielter 2">Rielter 2</Option>
                        <Option value="Rielter 3">Rielter 3</Option>
                        <Option value="Rielter 4">Rielter 4</Option>
                        <Option value="Rielter 5">Rielter 5</Option>
                    </Select>
                </Form.Item>
                {/* Opisaniya */}
                <Form.Item label="Primichaniya (Izohlash)" name="opisaniya">
                    <Input.TextArea placeholder="Remont yaxshi, mebel bor..." rows={3} />
                </Form.Item>

                {/* F.I.O */}
                <Form.Item label="F.I.O (Egasining ismi)" name="fio">
                    <Input placeholder="Aliyev Vali" />
                </Form.Item>

                {/* ID */}
                <Form.Item label="ID" name="id">
                    <Input placeholder="12345" type="number" />
                </Form.Item>



                <Form.Item
                    label="Uy turi"
                    name="uy_turi"
                >
                    <Select placeholder="Uy turi">
                        <Option value="Kirpich">Kirpich</Option>
                        <Option value="Panel">Panel</Option>
                        <Option value="Beton">Beton</Option>
                        <Option value="Monolitniy/B">Monolitniy/B</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Planirovka"
                    name="planirovka"
                >
                    <Select placeholder="Planirovka">
                        <Option value="Tashkent">Tashkent</Option>
                        <Option value="Fransuzkiy">Fransuzkiy</Option>
                        <Option value="Uluchshiniy 2ta zal">Uluchshiniy+2 ta zal</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Xolati"
                    name="xolati"
                >
                    <Select placeholder="Xolati">
                        <Option value="Kapitalniy">Kapitalniy</Option>
                        <Option value="Ortacha">Ortacha</Option>
                        <Option value="Toza">Toza</Option>
                        <Option value="Kosmetichiskiy">Kosmetichiskiy</Option>
                        <Option value="Bez remont">Bez remont</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Torets"
                    name="torets"

                >
                    <Select placeholder="Torets">
                        <Option value="Torets">Torets</Option>
                        <Option value="Ne Torets">Ne Torets</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Balkon"
                    name="balkon"
                >
                    <Select placeholder="Balkon">
                        <Option value="2x6">2x6</Option>
                        <Option value="2x7">2x7</Option>
                        <Option value="1.5X6">1.5x6</Option>
                        <Option value="2x3">2x3</Option>
                        <Option value="2x3 + 2x3">2x3 + 2x3</Option>
                        <Option value="1x7">1x7</Option>
                        <Option value="2x4.5 + 1x1.5">2x4.5 + 1x1.5</Option>
                        <Option value="2x9">2x9</Option>
                    </Select>
                </Form.Item>

                {/* Osmotir vaqti */}
                <Form.Item label="Osmotir vaqti" style={{ marginBottom: 8 }}>
                    <div className="osmotir-row">
                        <Form.Item
                            name="osmotir_sana"

                            noStyle
                        >
                            <input
                                className="osmotir-input osmotir-date"
                                type="date"
                                placeholder="DD-MM-YYYY"
                            />
                        </Form.Item>

                        <Form.Item
                            name="osmotir_vaqt"

                            noStyle
                        >
                            <input
                                className="osmotir-input osmotir-time"
                                type="time"
                                step="60"
                                placeholder="HH:MM"
                            />
                        </Form.Item>
                    </div>
                </Form.Item>




                <Row justify="center">
                    <Col span={20}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{
                                backgroundColor: "#1677ff",
                                borderRadius: 8,
                                padding: "0 100px",
                                margin:"20px 0",
                                width:"100%"
                            }}
                        >
                            {loading ? "Yuborilmoqda..." : "Yuborish"}
                        </Button>
                    </Col>
                </Row>
                {/* 📸 Rasmlar */}
                <Form.Item label="Rasmlar" name="rasmlar">
                    <Upload.Dragger
                        multiple
                        listType="picture"
                        accept="image/*"
                        beforeUpload={() => false} // uploadni to‘xtatamiz
                        onChange={({ fileList }) => {
                            const files = fileList.map(f => f.originFileObj);
                            Promise.all(
                                files.map(file => {
                                    return new Promise(resolve => {
                                        const reader = new FileReader();
                                        reader.onload = e => resolve(e.target.result);
                                        reader.readAsDataURL(file);
                                    });
                                })
                            ).then(base64List => {
                                form.setFieldsValue({ rasmlar: base64List });
                            });
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Rasmlarni bu yerga tashlang yoki tanlang
                        </p>
                        <p className="ant-upload-hint">PNG, JPG yoki JPEG fayllar qo‘llanadi</p>
                    </Upload.Dragger>
                </Form.Item>

            </Form>
        </div>
    );
};

export default TableMaskan;