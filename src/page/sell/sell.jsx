import React, {useEffect, useRef, useState} from "react";
import {Form, Input, InputNumber, Row, Select, Button, message} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import "./sell.css";
import {Link} from "react-router-dom";
import Form_maskan from "./component/form_maskan/form_maskan.jsx";
import Right_content from "./component/right_content/right_content.jsx";


const Sell = () => {

    const [generatedText, setGeneratedText] = useState("");


    return (
        <div className="container mt-5">

            <Link to={"/table"} style={{fontSize: "40px"}}>TABLE</Link>

            <div className="box">
                <div className="box_form">
                    <Form_maskan onGenerate={setGeneratedText}/>
                </div>

                <div className="box_content">
                    <Right_content generatedText={generatedText} setGeneratedText={setGeneratedText}/>
                </div>
            </div>
        </div>
    );
};

export default Sell;
