import React from 'react';
import {Route, Routes} from "react-router-dom";
import Sell from "./page/sell/sell.jsx";
import TableMaskan from "./page/table/tableMaskan.jsx";
import Login from "./page/login/login.jsx";

const App = () => {
    return (
        <Routes>
            <Route element={<Sell/>} path={"/"}/>
            <Route element={<TableMaskan/>} path={"/table"}/>
            <Route element={<Login/>} path={"/login"}/>
        </Routes>
    );
};

export default App;