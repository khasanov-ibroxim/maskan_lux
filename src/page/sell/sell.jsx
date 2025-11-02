import React, { useEffect, useRef, useState } from "react";
import { Form, Input, InputNumber, Row, Select, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import "./sell.css";

const { Option } = Select;

// === 1️⃣ Tarjima obyektlar
const translations = {
    Kiril: {
        sellType: { label: "Сотув ёки ижара", options: { sotuv: "Сотув", arenda: "Ижара" } },
        lang: "Тил",
        platform: { label: "Платформа", options: { OLX: "OLX", Telegram: "Телеграм" } },
        kvartil: "Квартал",
        xona: "Хона",
        etaj: "Қават",
        etajnist: "Қаватлар сони",
        maydoni: "Майдони",
        narxi: "Нархи",
        balkon: { label: "Балкон", options: { "2x6": "2x6", "1x7": "1x7", "2x3": "2x3" } },
        domTuri: { label: "Уй тури", options: { Kirpich: "Кирпич", Panel: "Панел", Monolit: "Монолит" } },
        remont: { label: "Ремонт", options: { Yevro: "Евро", Toza: "Тоза", Kapital: "Капитал" } },
        orintir: "Ориентир",
        qoshimcha: "Қўшимча",
    },
    Ozbek: {
        sellType: { label: "Sotuv yoki ijaraga berish", options: { sotuv: "Sotuv", arenda: "Ijara" } },
        lang: "Til",
        platform: { label: "Platforma", options: { OLX: "OLX", Telegram: "Telegram" } },
        kvartil: "Kvartal",
        xona: "Xona",
        etaj: "Qavat",
        etajnist: "Qavatlar soni",
        maydoni: "Maydoni",
        narxi: "Narxi",
        balkon: { label: "Balkon", options: { "2x6": "2x6", "1x7": "1x7", "2x3": "2x3" } },
        domTuri: { label: "Uy turi", options: { Kirpich: "G‘ishtli", Panel: "Panel", Monolit: "Monolit" } },
        remont: { label: "Remont", options: { Yevro: "Yevroremont", Toza: "Toza", Kapital: "Kapital" } },
        orintir: "Mo‘ljal",
        qoshimcha: "Qo‘shimcha",
    },
    Ru: {
        sellType: { label: "Тип сделки", options: { sotuv: "Продажа", arenda: "Аренда" } },
        lang: "Язык",
        platform: { label: "Платформа", options: { OLX: "OLX", Telegram: "Телеграм" } },
        kvartil: "Квартал",
        xona: "Комната",
        etaj: "Этаж",
        etajnist: "Этажность",
        maydoni: "Площадь",
        narxi: "Цена",
        balkon: { label: "Балкон", options: { "2x6": "2x6", "1x7": "1x7", "2x3": "2x3" } },
        domTuri: { label: "Тип дома", options: { Kirpich: "Кирпичный", Panel: "Панельный", Monolit: "Монолитный" } },
        remont: { label: "Ремонт", options: { Yevro: "Евроремонт", Toza: "Чистый", Kapital: "Капитальный" } },
        orintir: "Ориентир",
        qoshimcha: "Дополнительно",
    },
};

// === 2️⃣ Tuman nomlarini tilda chiqarish
const locationNames = {
    Kiril: { Yunusobod: "Юнусобод" },
    Ozbek: { Yunusobod: "Yunusobod" },
    Ru: { Yunusobod: "Юнусабад" },
};

const Sell = () => {
    const divRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({});
    const [generatedText, setGeneratedText] = useState("");
    const [form] = Form.useForm();

    const lang = formData.lang || "Ozbek";
    const t = translations[lang];
    const loc = locationNames[lang]?.Yunusobod || "Yunusobod";

    // === Nusxa olish
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedText || "");
            message.success("Nusxalandi!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            message.error("Nusxalashda xato!");
        }
    };

    // === Matn generatsiyasi
    const handleGenerate = () => {
        const {
            sell_type,
            platform,
            kavrtil,
            Xona,
            Etaj,
            Etajnist,
            Maydoni,
            Narxi,
            Remont,
            "Dom turi": domTuri,
            Balkon,
            Orintir,
            Qoshimcha,
        } = formData;

        const isTelegram = platform === "Telegram";
        const e = (icon) => (isTelegram ? icon + " " : "• ");

        // === Tarjima sozlamalari
        const dict = {
            Ozbek: {
                sell: sell_type === "arenda" ? "Ijaraga beriladi" : "Sotiladi",
                rooms: "xona",
                price: "Narxi",
                labels: {
                    Qavat: "Qavat",
                    Maydoni: "Maydoni",
                    Narxi: "Narxi",
                    Remont: "Remont",
                    "Uy turi": "Uy turi",
                    Balkon: "Balkon",
                    Orintir: "Orintir",
                    Qoshimcha: "Qo‘shimcha",
                    Aloqa: "Aloqa",
                },
            },
            Kiril: {
                sell: sell_type === "arenda" ? "Ижарага берилади" : "Сотилади",
                rooms: "хона",
                price: "Нархи",
                labels: {
                    Qavat: "Қават",
                    Maydoni: "Майдони",
                    Narxi: "Нархи",
                    Remont: "Ремонт",
                    "Uy turi": "Уй тури",
                    Balkon: "Балкон",
                    Orintir: "Ориентир",
                    Qoshimcha: "Қўшимча",
                    Aloqa: "Алоқа",
                },
            },
            Ru: {
                sell: sell_type === "arenda" ? "Сдаётся" : "Продаётся",
                rooms: "комната",
                price: "Цена",
                labels: {
                    Qavat: "Этаж",
                    Maydoni: "Площадь",
                    Narxi: "Цена",
                    Remont: "Ремонт",
                    "Uy turi": "Тип дома",
                    Balkon: "Балкон",
                    Orintir: "Ориентир",
                    Qoshimcha: "Дополнительно",
                    Aloqa: "Контакт",
                },
            },
        }[lang || "Ozbek"];

        // === Qiymatlarni tilga qarab o‘girish
        const translateOption = (category, value) => {
            const opts = translations[lang][category]?.options;
            return opts?.[value] || value;
        };

        const remontLabel = translateOption("remont", Remont);
        const domLabel = translateOption("domTuri", domTuri);
        const balkonLabel = translateOption("balkon", Balkon);

        const finalText =
            `${e("🏠")}${dict.sell} — ${locationNames[lang]?.Yunusobod || "Yunusobod"} ${kavrtil || ""}, ${Xona || "?"} ${dict.rooms}\n\n` +
            `${Etaj && Etajnist ? `${e("🏢")}${dict.labels.Qavat}: ${Etaj}/${Etajnist}\n` : ""}` +
            `${Maydoni ? `${e("📐")}${dict.labels.Maydoni}: ${Maydoni} м²\n` : ""}` +
            `${Narxi ? `${e("💰")}${dict.labels.Narxi}: ${Number(Narxi).toLocaleString()} $\n` : ""}` +
            `${Remont ? `${e("🧱")}${dict.labels.Remont}: ${remontLabel}\n` : ""}` +
            `${domTuri ? `${e("🏢")}${dict.labels["Uy turi"]}: ${domLabel}\n` : ""}` +
            `${Balkon ? `${e("🏗")}${dict.labels.Balkon}: ${balkonLabel}\n` : ""}` +
            `${Orintir ? `${e("📍")}${dict.labels.Orintir}: ${Orintir}\n` : ""}` +
            `${Qoshimcha ? `${e("📄")}${dict.labels.Qoshimcha}: ${Qoshimcha}` : ""}\n\n` +
            `${e("📞")}${dict.labels.Aloqa}: +998 33 111 06 04 — Дониёр`;

        setGeneratedText(finalText.trim());
    };


    useEffect(() => handleGenerate(), [formData]);

    return (
        <div className="container mt-5">
            <div className="box">
                <div className="box_form">
                    <Form layout="vertical" form={form} onValuesChange={(_, all) => setFormData(all)}>
                        <Row gutter={12} style={{ gap: "20px" }}>
                            <Form.Item name="sell_type" label={t.sellType.label}>
                                <Select>
                                    <Option value="sotuv">{t.sellType.options.sotuv}</Option>
                                    <Option value="arenda">{t.sellType.options.arenda}</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="lang" label={t.lang}>
                                <Select style={{ minWidth: "120px" }}>
                                    <Option value="Kiril">Кирил</Option>
                                    <Option value="Ozbek">O‘zbek</Option>
                                    <Option value="Ru">Русский</Option>
                                </Select>
                            </Form.Item>
                        </Row>

                        <Form.Item name="platform" label={t.platform.label}>
                            <Select>
                                <Option value="OLX">{t.platform.options.OLX}</Option>
                                <Option value="Telegram">{t.platform.options.Telegram}</Option>
                            </Select>
                        </Form.Item>

                        <Row gutter={12} style={{ gap: "20px" }}>
                            <Form.Item name="kavrtil" label={t.kvartil}>
                                <Select style={{ minWidth: "100px" }}>
                                    {[...Array(19)].map((_, i) => (
                                        <Option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="Xona" label={t.xona}>
                                <Select style={{ minWidth: "60px" }}>
                                    {[...Array(10)].map((_, i) => (
                                        <Option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="Etaj" label={t.etaj}>
                                <Select style={{ minWidth: "60px" }}>
                                    {[...Array(20)].map((_, i) => (
                                        <Option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="Etajnist" label={t.etajnist}>
                                <Select style={{ minWidth: "60px" }}>
                                    {[...Array(20)].map((_, i) => (
                                        <Option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Row>

                        <Row gutter={12} style={{ gap: "20px" }}>
                            <Form.Item name="Maydoni" label={t.maydoni}>
                                <Input suffix="м²" />
                            </Form.Item>

                            <Form.Item name="Narxi" label={t.narxi}>
                                <InputNumber
                                    style={{ width: "120px" }}
                                    formatter={(v) =>
                                        v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $" : ""
                                    }
                                    parser={(v) => v.replace(/\s|\$/g, "")}
                                />
                            </Form.Item>

                            <Form.Item name="Balkon" label={t.balkon.label}>
                                <Select>
                                    {Object.entries(t.balkon.options).map(([v, l]) => (
                                        <Option key={v} value={v}>
                                            {l}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="Dom turi" label={t.domTuri.label}>
                                <Select>
                                    {Object.entries(t.domTuri.options).map(([v, l]) => (
                                        <Option key={v} value={v}>
                                            {l}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="Remont" label={t.remont.label}>
                                <Select>
                                    {Object.entries(t.remont.options).map(([v, l]) => (
                                        <Option key={v} value={v}>
                                            {l}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Row>

                        <Form.Item name="Orintir" label={t.orintir}>
                            <Input.TextArea />
                        </Form.Item>

                        <Form.Item name="Qoshimcha" label={t.qoshimcha}>
                            <Input.TextArea />
                        </Form.Item>
                    </Form>
                </div>

                <div className="box_content">
                    <div ref={divRef} style={{ padding: 12, border: "1px solid #eee", whiteSpace: "pre-wrap" }}>
                        {generatedText}
                    </div>
                    <Button style={{ marginTop: 8 }} onClick={handleCopy} icon={<CopyOutlined />}>
                        {copied ? "Nusxa olindi" : "Nusxa ol"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Sell;
