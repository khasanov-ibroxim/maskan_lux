import React, { useRef, useState } from "react";
import { Button, message, Upload } from "antd";
import { CopyOutlined, InboxOutlined, SendOutlined } from "@ant-design/icons";
import axios from "axios";

const { Dragger } = Upload;

// Telegram ma'lumotlari
const TOKEN = "8504311369:AAEMh3ohupPdRaX1Qx61MpZ9jf3mIdhsTKA";
const CHAT_ID = "1376002269";

const RightContent = ({ generatedText, setGeneratedText }) => {
    const divRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [sending, setSending] = useState(false);
    const [images, setImages] = useState([]);

    // === Dragger konfiguratsiyasi (rasmlar uchun)
    const props = {
        name: "file",
        multiple: true,
        accept: "image/*",
        beforeUpload: (file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImages((prev) => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
            return false;
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
    };

    // === Nusxalash funksiyasi
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedText || "");
            message.success("Matn nusxalandi!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            message.error("Nusxalashda xato!");
        }
    };

    // === Base64 ni Blob ga aylantirish
    const base64ToBlob = (base64) => {
        const parts = base64.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    };

    // === Telegramga yuborish (matn + rasm(lar))
    const handleSend = async () => {
        if (!generatedText?.trim()) {
            message.warning("Avval matnni kiriting yoki generatsiya qiling!");
            return;
        }

        setSending(true);
        try {
            if (images.length === 0) {

                await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                    chat_id: CHAT_ID,
                    text: generatedText,
                    parse_mode: "HTML",
                });
                message.success("Matn yuborildi ✅");
            } else if (images.length === 1) {

                const formData = new FormData();
                formData.append('chat_id', CHAT_ID);
                formData.append('caption', generatedText);
                formData.append('parse_mode', 'HTML');
                formData.append('photo', base64ToBlob(images[0]), 'photo.jpg');

                await axios.post(
                    `https://api.telegram.org/bot${TOKEN}/sendPhoto`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }
                );
                message.success("Rasm va matn yuborildi ✅");
            } else {

                const formData = new FormData();
                formData.append('chat_id', CHAT_ID);

                // Media array yaratamiz
                const media = images.map((_, idx) => ({
                    type: "photo",
                    media: `attach://photo${idx}`,
                    caption: idx === 0 ? generatedText : undefined,
                    parse_mode: idx === 0 ? "HTML" : undefined,
                }));

                formData.append('media', JSON.stringify(media));


                images.forEach((img, idx) => {
                    formData.append(`photo${idx}`, base64ToBlob(img), `photo${idx}.jpg`);
                });

                await axios.post(
                    `https://api.telegram.org/bot${TOKEN}/sendMediaGroup`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }
                );

                message.success(`${images.length} ta rasm bitta postda yuborildi ✅`);
            }

            window.location.reload()
        } catch (err) {
            console.error("Xato:", err.response?.data || err);
            message.error("Telegramga yuborishda xato ❌");
        } finally {
            setSending(false);
        }
    };



    return (
        <div style={{padding: 10}}>
            <div style={{display: "flex", gap: 10 , marginBottom:"20px"}}>
                <Button
                    type="primary"
                    icon={<SendOutlined/>}
                    loading={sending}
                    onClick={handleSend}
                    disabled={!generatedText?.trim()}
                >
                    Telegram
                </Button>
                <Button onClick={handleCopy} icon={<CopyOutlined/>}>
                    {copied ? "Nusxa olindi" : "Nusxa ol"}
                </Button>
            </div>
            <div
                ref={divRef}
                style={{
                    padding: 12,
                    border: "1px solid #eee",
                    whiteSpace: "pre-wrap",
                    minHeight: 100,
                    borderRadius: 6,
                    marginBottom: 10,
                }}
            >
                {generatedText || "Hozircha matn yo'q..."}
            </div>


            <Dragger {...props} style={{marginBottom: 15}} listType={"picture-card"}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                </p>
                <p className="ant-upload-text">
                    Rasmlarni bu yerga tashlang yoki tanlang
                </p>
                <p className="ant-upload-hint">
                    JPG, PNG, WEBP formatdagi bir nechta rasmni yuborish mumkin
                </p>
            </Dragger>




        </div>
    );
};

export default RightContent;