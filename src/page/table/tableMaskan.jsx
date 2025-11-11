import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, message, Row, Col, InputNumber, Progress } from "antd";
import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./tableMaskan.css";
import { users } from "../login/users.jsx";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnvIdgVLD8u4GrkXSc83z5jOOfLRCgut7_rczbe2KuASF4I7kgnECemW6u9YAO2J_F/exec";
const { Option } = Select;
import { Rielter } from "./db/rielter.jsx";

// ✅ RASMNI SIQISH (WEBP formatida, 800px max)
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Max 800px (katta rasmlarni kichraytirish)
                let width = img.width;
                let height = img.height;
                const maxSize = 800;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // WEBP formatida (70% sifat)
                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    'image/webp',
                    0.7
                );
            };

            img.onerror = reject;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ✅ RASMLARNI BASE64 GA AYLANTIRISH (faqat ko'rsatish uchun)
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const formatDateToDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const TableMaskan = () => {
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [compressedImages, setCompressedImages] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        const storedUser = localStorage.getItem("userData") || sessionStorage.getItem("userData");

        if (!storedUser) {
            message.warning("Iltimos, tizimga kiring!");
            window.location.href = "/login";
            return;
        }

        const userData = JSON.parse(storedUser);
        const findUser = users.find((u) => u.username === userData.username);

        if (!findUser) {
            message.error("Foydalanuvchi topilmadi!");
            window.location.href = "/login";
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

    const findRielterData = (rielterName) => {
        return Rielter.find((r) => r.name === rielterName);
    };

    // ✅ RASMLARNI SIQISH VA SAQLASH
    const handleImageUpload = async ({ fileList }) => {
        setUploadProgress(5);

        const files = fileList.map((f) => f.originFileObj).filter(Boolean);

        if (files.length === 0) {
            setCompressedImages([]);
            setUploadProgress(0);
            return;
        }

        try {
            const compressed = [];

            for (let i = 0; i < files.length; i++) {
                const blob = await compressImage(files[i]);
                const base64 = await blobToBase64(blob);
                compressed.push(base64);

                // Progress
                const progress = 5 + ((i + 1) / files.length) * 15;
                setUploadProgress(Math.round(progress));
            }

            setCompressedImages(compressed);
            setUploadProgress(20);
            message.success(`✅ ${files.length} ta rasm siqildi (hajm 70% kamaydi)`);

        } catch (error) {
            console.error("Rasm siqishda xato:", error);
            message.error("Rasmlarni siqishda xatolik");
            setCompressedImages([]);
            setUploadProgress(0);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        setUploadProgress(5);

        try {
            console.log("🚀 YUBORISH BOSHLANDI");

            // 1️⃣ Ma'lumotlarni tayyorlash
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
                const sana = values.osmotir_sana ? formatDateToDDMMYYYY(values.osmotir_sana) : "";
                const vaqt = values.osmotir_vaqt || "";
                osmotir = (sana + (sana && vaqt ? " " : "") + vaqt).trim();
            }

            const now = new Date();
            const currentDateTime = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const rielterData = findRielterData(values.rieltor);

            setUploadProgress(10);

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
                rasmlar: compressedImages,
                uy_turi: values.uy_turi || "",
                planirovka: values.planirovka || "",
                xolati: values.xolati || "",
                torets: values.torets || "",
                balkon: values.balkon || "",
                osmotir: osmotir || "",
                dom: values.dom || "",
                kvartira: values.kvartira || "",
                telegram: rielterData
                    ? {
                        chatId: rielterData.rielterChatId,
                        themeId: rielterData.themeId,
                    }
                    : null,
            };

            console.log(`📦 Rasmlar: ${compressedImages.length} ta`);
            setUploadProgress(20);

            // 2️⃣ GLAVNIY Excel-ga yuborish (SINXRON - kutamiz!)
            console.log("📤 GLAVNIY Excel-ga yuborish...");
            const mainResult = await sendToGoogleScriptSync(SCRIPT_URL, dataToSend, 120000); // 2 daqiqa timeout

            setUploadProgress(60);

            if (!mainResult.success) {
                throw new Error(`GLAVNIY Excel xato: ${mainResult.error || 'Unknown error'}`);
            }

            console.log("✅ GLAVNIY Excel-ga yuborildi!");
            console.log(`📁 Folder link: ${mainResult.folderLink || 'Yo\'q'}`);

            // 3️⃣ Rieltor Excel-iga yuborish (agar kerak bo'lsa)
            let rielterSuccess = false;

            if (rielterData && rielterData.rielterExcelId) {
                console.log(`📤 ${values.rieltor} Excel-iga yuborish...`);
                setUploadProgress(70);

                const rielterResult = await sendToGoogleScriptSync(
                    rielterData.rielterExcelId,
                    dataToSend,
                    120000
                );

                setUploadProgress(90);

                if (!rielterResult.success) {
                    console.warn(`⚠️ Rieltor Excel xato:`, rielterResult.error);
                    message.warning(`⚠️ ${values.rieltor} Excel-iga yuborishda muammo`);
                } else {
                    console.log(`✅ ${values.rieltor} Excel-iga yuborildi!`);
                    rielterSuccess = true;
                }
            }

            setUploadProgress(100);

            // 4️⃣ Natija
            const successMsg = mainResult.folderLink
                ? "✅ Ma'lumot va rasmlar saqlandi!"
                : "✅ Ma'lumot saqlandi!";

            if (rielterSuccess) {
                message.success(successMsg + ` (${values.rieltor} Excel-iga ham yuborildi)`);
            } else {
                message.success(successMsg);
            }

            // Formani tozalash
            form.resetFields();
            setCompressedImages([]);

            const savedSheet = localStorage.getItem("selectedSheetName");
            const savedSheetType = localStorage.getItem("selectedSheetType");
            if (savedSheet) {
                form.setFieldsValue({
                    sheetName: savedSheet,
                    sheetType: savedSheetType,
                });
            }

            setTimeout(() => {
                setUploadProgress(0);
            }, 2000);

        } catch (err) {
            console.error("❌ XATO:", err);
            message.error(`❌ Yuborishda xatolik: ${err.message}`);
            setUploadProgress(0);
        } finally {
            setLoading(false);
        }
    };

// ========================================
// SINXRON YUBORISH (kutib turadi)
// ========================================
    const sendToGoogleScriptSync = async (url, data, timeout = 120000) => {
        try {
            const scriptType = url.includes("AKfycbzcxlF0") ? "GLAVNIY" : "RIELTER";
            console.log(`📤 ${scriptType} - Yuborish boshlandi`);
            console.log(`⏱️ Timeout: ${timeout / 1000}s`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const startTime = Date.now();

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(data),
                signal: controller.signal,
                redirect: "follow"
            });

            clearTimeout(timeoutId);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`⏱️ Vaqt: ${elapsed}s`);
            console.log(`📊 Status: ${response.status} ${response.statusText}`);

            // Javobni o'qish
            let result = null;
            try {
                const text = await response.text();
                console.log(`📄 Response (100 char): ${text.substring(0, 100)}`);

                result = JSON.parse(text);
                console.log(`✅ JSON parsed:`, result);
            } catch (e) {
                console.warn(`⚠️ JSON parse xato: ${e.message}`);
            }

            // Status tekshirish
            if (response.ok || response.status === 0 || response.status === 302) {
                return {
                    success: true,
                    data: result,
                    folderLink: result?.folderLink || null,
                    elapsed: elapsed
                };
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            if (error.name === "AbortError") {
                console.error(`⏱️ TIMEOUT: ${timeout / 1000}s`);
                return {
                    success: false,
                    error: "Server javob bermadi (timeout)",
                    timeout: true
                };
            }

            console.error(`❌ Xato:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    };
// ✅ TESTLASH UCHUN
    async function testConnection() {
        const testData = {
            sheetName: "1 xona",
            sheetType: "Sotuv",
            kvartil: "Yunusobod - 1",
            xet: "1/1/5",
            tell: "+998901234567",
            m2: "50",
            narx: "50000",
            xodim: "Test",
            rieltor: "Aziz",
            rasmlar: []  // Test uchun bo'sh
        };

        console.log("🧪 Test boshlanmoqda...");

        const result = await sendToGoogleScript(
            "https://script.google.com/macros/s/AKfycbx8KUmH_FDdZ5wsazP7m6nl5Hn1QuwEmaF-HUGzZHaFiDqdw0pO57IcVUSVKPwXQoyQ/exec",
            testData
        );

        console.log("🧪 Test natijasi:", result);
        return result;
    }

// Browser console-da ishga tushirish: testConnection()
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