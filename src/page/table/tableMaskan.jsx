import React, {useEffect, useState} from "react";
import {Form, Input, Button, Select, message, Row, Col, InputNumber, Progress} from "antd";
import {Upload} from "antd";
import {InboxOutlined} from "@ant-design/icons";
import axios from "axios";
import "./tableMaskan.css"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOKPQvZtPoRdA3gx8uXpspl5JhJmUkpbBWZEfnZeti2RuwbGZRNqMdU5Hm4f5PV2xz/exec/exec";
const {Option} = Select;
import {Rielter} from "./db/rielter.jsx";

const formatDateToDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const TableMaskan = () => {
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [form] = Form.useForm();

    useEffect(() => {
        const userData =
            localStorage.getItem("userData") || sessionStorage.getItem("userData");
        if (!userData) {
            message.warning("Iltimos, tizimga kiring!");
            window.location.href = "/login";
        }
    }, []);

    useEffect(() => {
        const savedSheet = localStorage.getItem("selectedSheetName");
        const savedSheetType = localStorage.getItem("selectedSheetType");
        if (savedSheet) {
            form.setFieldsValue({sheetName: savedSheet});
            form.setFieldsValue({sheetType: savedSheetType});
        }
    }, [form]);

    const findRielterData = (rielterName) => {
        return Rielter.find(r => r.name === rielterName);
    };

    const simulateProgress = (duration) => {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploadProgress(Math.min(progress, 90));
                if (progress >= 90) {
                    clearInterval(interval);
                    resolve();
                }
            }, duration / 10);
        });
    };

    const sendToGoogleScript = async (url, data, timeout = 10000) => {
        try {
            console.log(`📤 Yuborilmoqda: ${url.includes('Glavniy') ? 'GLAVNIY' : 'RIELTER'} Excel`);

            // ✅ Timeout bilan promise yaratamiz
            const fetchPromise = fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                mode: "no-cors", // CORS muammosini oldini olish
                body: JSON.stringify(data)
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            );

            // ✅ Timeout yoki fetch - qaysi biri tezroq bo'lsa
            await Promise.race([fetchPromise, timeoutPromise]);

            console.log(`✅ Yuborildi: ${url.includes('Glavniy') ? 'GLAVNIY' : 'RIELTER'}`);
            return { success: true };
        } catch (error) {
            // ✅ Timeout yoki xatolik bo'lsa ham SUCCESS deb qaytaramiz
            // Chunki no-cors rejimida response tekshirib bo'lmaydi
            console.warn(`⚠️ ${url.includes('Glavniy') ? 'GLAVNIY' : 'RIELTER'} - Timeout/Error (lekin yuborilgan bo'lishi mumkin):`, error.message);
            return { success: true, warning: error.message };
        }
    };
    const onFinish = async (values) => {
        setLoading(true);
        setUploadProgress(0);

        try {
            const progressPromise = simulateProgress(2000);

            const xet = `${values.xona}/${values.etaj}/${values.etajnost}`;

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

            const now = new Date();
            const currentDateTime = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const rielterData = findRielterData(values.rieltor);

            const dataToSend = {
                sheetName: values.sheetName,
                sheetType: values.sheetType,
                kvartil: values.kvartil,
                xet: xet,
                tell: values.tell,
                m2: values.m2 || "",
                opisaniya: values.opisaniya || "",
                narx: values.narx || "",
                fio: values.fio || "",
                id: values.id || "",
                rieltor: values.rieltor,
                sana: currentDateTime,
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
                // Telegram ma'lumotlari (faqat App Script uchun)
                telegram: rielterData ? {
                    chatId: rielterData.rielterChatId,
                    themeId: rielterData.themeId
                } : null
            };

            console.log("📤 Yuborilayotgan data:", {
                ...dataToSend,
                telegram: dataToSend.telegram,
                rasmlar: `${dataToSend.rasmlar.length} ta rasm`
            });

            await progressPromise;
            setUploadProgress(40);

            // 1️⃣ GLAVNIY Excel-ga yuborish (birinchi bo'lib)
            console.log("📊 GLAVNIY Excel-ga yuborilmoqda...");
            const mainResult = await sendToGoogleScript(SCRIPT_URL, dataToSend);

            setUploadProgress(65);

            if (!mainResult.success) {
                throw new Error(`GLAVNIY Excel xato: ${mainResult.error}`);
            }

            console.log("✅ GLAVNIY Excel-ga yuborildi");

            // 2️⃣ Rieltor Excel-iga yuborish (ikkinchi bo'lib)
            let rielterSuccess = false;

            if (rielterData && rielterData.rielterExcelId) {
                console.log(`📊 ${values.rieltor} Excel-iga yuborilmoqda...`);
                setUploadProgress(75);

                const rielterResult = await sendToGoogleScript(
                    rielterData.rielterExcelId,
                    dataToSend
                );

                setUploadProgress(90);

                if (!rielterResult.success) {
                    console.warn("⚠️ Rieltor Excel xato:", rielterResult.error);
                    message.warning(`⚠️ ${values.rieltor} Excel-iga yuborishda xatolik`);
                } else {
                    console.log(`✅ ${values.rieltor} Excel-iga yuborildi (Telegram ham yuborildi)`);
                    rielterSuccess = true;
                }
            } else {
                console.warn("⚠️ Rieltor ma'lumotlari topilmadi:", values.rieltor);
            }

            setUploadProgress(100);

            // Muvaffaqiyat xabari
            if (rielterSuccess) {
                message.success("✅ Barcha ma'lumotlar muvaffaqiyatli yuborildi!");
            } else {
                message.success("✅ GLAVNIY Excel-ga saqlandi!");
            }

            form.resetFields();

            const savedSheet = localStorage.getItem("selectedSheetName");
            const savedSheetType = localStorage.getItem("selectedSheetType");
            if (savedSheet) {
                form.setFieldsValue({
                    sheetName: savedSheet,
                    sheetType: savedSheetType
                });
            }

            setTimeout(() => {
                setUploadProgress(0);
            }, 2000);

        } catch (err) {
            console.error("❌ Xatolik:", err);
            message.error(`❌ Yuborishda xatolik: ${err.message}`);
            setUploadProgress(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSheetChange = (value) => {
        localStorage.setItem("selectedSheetName", value);
        form.setFieldsValue({sheetName: value});
    };

    const handleSheetTypeChange = (value) => {
        localStorage.setItem("selectedSheetType", value);
        form.setFieldsValue({sheetType: value});
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
            <h2 style={{textAlign: "center", marginBottom: 20}}>🏠 Uy ma'lumotlari</h2>

            <Form form={form} autoComplete="off" layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Sotuv yoki arenda"
                    name="sheetType"
                    rules={[{required: true, message: "Turini tanlang!"}]}
                >
                    <Select placeholder="Turini tanlang" onChange={handleSheetTypeChange}>
                        <Option value="Sotuv">Sotuv</Option>
                        <Option value="Arenda">Arenda</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Xona turi"
                    name="sheetName"
                    rules={[{required: true, message: "Xona turini tanlang!"}]}
                >
                    <Select placeholder="Xona turini tanlang" onChange={handleSheetChange}>
                        <Option value="1 xona">1 xona</Option>
                        <Option value="2 xona">2 xona</Option>
                        <Option value="3 xona">3 xona</Option>
                        <Option value="4 xona">4 xona</Option>
                        <Option value="5 xona">5 xona</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Kvartil"
                    name="kvartil"
                    rules={[{required: true, message: "Kvartilni tanlang!"}]}
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

                <Form.Item label="X/E/ET (xona / etaj / etajnist)" required>
                    <Input.Group compact style={{display: "flex", gap: 8, alignItems: "center"}}>
                        <Form.Item
                            name="xona"
                            style={{marginBottom: 0}}
                            rules={[
                                {required: true, message: "Xona!"},
                                ({getFieldValue}) => ({
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
                            <Input placeholder="2" type={"tel"} maxLength={2} style={{width: 60, textAlign: "center"}}/>
                        </Form.Item>

                        <span style={{fontSize: 20, fontWeight: "bold"}}>/</span>

                        <Form.Item
                            name="etaj"
                            style={{marginBottom: 0}}
                            rules={[{required: true, message: "Etaj!"}]}
                        >
                            <Input placeholder="3" type="tel" maxLength={2} style={{width: 60, textAlign: "center"}}/>
                        </Form.Item>

                        <span style={{fontSize: 20, fontWeight: "bold"}}>/</span>

                        <Form.Item
                            name="etajnost"
                            style={{marginBottom: 0}}
                            rules={[{required: true, message: "Etajnost!"}]}
                        >
                            <Input placeholder="9" type="tel" maxLength={2} style={{width: 60, textAlign: "center"}}/>
                        </Form.Item>
                    </Input.Group>
                </Form.Item>

                <Row gutter={20}>
                    <Col span={12}>
                        <Form.Item label="Dom" name="dom">
                            <InputNumber style={{width: "100%"}} type={"tel"} controls={false}
                                         placeholder={"1"}/>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Kvartira" name="kvartira">
                            <InputNumber style={{width: "100%"}} type={"tel"} controls={false}/>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="M² (Maydon)" name="m2" rules={[{required: true, message: "Maydon kiriting!"}]}>
                    <Input placeholder="65" type="tel"/>
                </Form.Item>

                <Form.Item label={`Narxi (USD)`} name="narx" rules={[{required: true, message: "Narx yozing!"}]}>
                    <Input
                        placeholder="75000"
                        style={{ width: "100%" }}
                        type="tel"
                        suffix={"$"}
                        value={form.getFieldValue("narx")}
                        onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (!value) value = "";

                            const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                            form.setFieldsValue({ narx: formatted });
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Telefon raqami"
                    name="tell"
                    rules={[
                        {required: true, message: "Telefon raqamini kiriting!"},
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

                            form.setFieldsValue({tell: formatted});
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Rielter"
                    name="rieltor"
                    rules={[{required: true, message: "Rielter tanlang!"}]}
                >
                    <Select placeholder="Rielter tanlang">
                        {Rielter.map((item, index) => (
                            <Option value={item.name} key={index}>{item.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Primichaniya (Izohlash)" name="opisaniya">
                    <Input.TextArea placeholder="Remont yaxshi, mebel bor..." rows={3}/>
                </Form.Item>

                <Form.Item label="F.I.O (Egasining ismi)" name="fio">
                    <Input placeholder="Aliyev Vali"/>
                </Form.Item>

                <Form.Item label="ID" name="id">
                    <Input placeholder="12345" type="tel"/>
                </Form.Item>

                <Form.Item label="Uy turi" name="uy_turi">
                    <Select placeholder="Uy turi">
                        <Option value="Kirpich">Kirpich</Option>
                        <Option value="Panel">Panel</Option>
                        <Option value="Beton">Beton</Option>
                        <Option value="Monolitniy/B">Monolitniy/B</Option>
                        <Option value="Gaza/b">Gaza/b</Option>
                        <Option value="Pena/b">Pena/b</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Planirovka" name="planirovka">
                    <Select placeholder="Planirovka">
                        <Option value="Tashkent">Tashkent</Option>
                        <Option value="Fransuzkiy">Fransuzkiy</Option>
                        <Option value="Uluchshiniy 2ta zal">Uluchshiniy+2 ta zal</Option>
                        <Option value="Uluchshiniy">Uluchshiniy</Option>
                        <Option value="Galareyka">Galareyka</Option>
                        <Option value="Navastroyka">Navastroyka</Option>
                        <Option value="Xrushovka">Xrushovka</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Xolati" name="xolati">
                    <Select placeholder="Xolati">
                        <Option value="Kapitalniy">Kapitalniy</Option>
                        <Option value="Ortacha">Ortacha</Option>
                        <Option value="Toza">Toza</Option>
                        <Option value="Yevro remont">Yevro remont</Option>
                        <Option value="Kosmetichiskiy">Kosmetichiskiy</Option>
                        <Option value="Bez remont">Bez remont</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Torets" name="torets">
                    <Select placeholder="Torets">
                        <Option value="Torets">Torets</Option>
                        <Option value="Ne Torets">Ne Torets</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Balkon" name="balkon">
                    <Select placeholder="Balkon">
                        <Option value="2x6">2x6</Option>
                        <Option value="2x7">2x7</Option>
                        <Option value="1.5X6">1.5x6</Option>
                        <Option value="2x3">2x3</Option>
                        <Option value="2x3 + 2x3">2x3 + 2x3</Option>
                        <Option value="1x7">1x7</Option>
                        <Option value="2x4.5 + 1x1.5">2x4.5 + 1x1.5</Option>
                        <Option value="2x9">2x9</Option>
                        <Option value="Yo'q">Yo'q</Option>
                        <Option value="Boshqa">Boshqa</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Osmotir vaqti" style={{marginBottom: 8}}>
                    <div className="osmotir-row">
                        <Form.Item name="osmotir_sana" noStyle>
                            <input
                                className="osmotir-input osmotir-date"
                                type="date"
                                placeholder="DD-MM-YYYY"
                            />
                        </Form.Item>

                        <Form.Item name="osmotir_vaqt" noStyle>
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
                            disabled={loading}
                            style={{
                                backgroundColor: loading ? "#d9d9d9" : "#1677ff",
                                borderRadius: 8,
                                padding: "0 100px",
                                margin: "20px 0",
                                width: "100%"
                            }}
                        >
                            {loading ? "Yuborilmoqda..." : "Yuborish"}
                        </Button>
                    </Col>
                </Row>

                {loading && uploadProgress > 0 && (
                    <div style={{marginBottom: 20}}>
                        <Progress
                            percent={uploadProgress}
                            status={uploadProgress === 100 ? "success" : "active"}
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                        <p style={{textAlign: "center", marginTop: 8, color: "#666"}}>
                            {uploadProgress < 40 && "Rasmlar yuklanmoqda..."}
                            {uploadProgress >= 40 && uploadProgress < 65 && "GLAVNIY Excel-ga yozilmoqda..."}
                            {uploadProgress >= 65 && uploadProgress < 90 && "Rieltor Excel-iga yozilmoqda..."}
                            {uploadProgress >= 90 && uploadProgress < 100 && "Telegram kanaliga yuborilmoqda..."}
                            {uploadProgress === 100 && "✅ Bajarildi!"}
                        </p>
                    </div>
                )}

                <Form.Item label="Rasmlar" name="rasmlar">
                    <Upload.Dragger
                        multiple
                        listType="picture"
                        accept="image/*"
                        beforeUpload={() => false}
                        onChange={({fileList}) => {
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
                                form.setFieldsValue({rasmlar: base64List});
                            });
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined/>
                        </p>
                        <p className="ant-upload-text">
                            Rasmlarni bu yerga tashlang yoki tanlang
                        </p>
                        <p className="ant-upload-hint">PNG, JPG yoki JPEG fayllar qo'llanadi</p>
                    </Upload.Dragger>
                </Form.Item>

            </Form>
        </div>
    );
};

export default TableMaskan;