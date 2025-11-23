import React, {useEffect} from 'react';
import {Route, Routes} from "react-router-dom";
import Sell from "./page/sell/sell.jsx";
import TableMaskan from "./page/table/tableMaskan.jsx";
import Login from "./page/login/login.jsx";


const App = () => {
    useEffect(() => {
        const preventGesture = (e) => e.preventDefault();
        document.addEventListener("gesturestart", preventGesture);
        document.addEventListener("gesturechange", preventGesture);
        document.addEventListener("gestureend", preventGesture);
        return () => {
            document.removeEventListener("gesturestart", preventGesture);
            document.removeEventListener("gesturechange", preventGesture);
            document.removeEventListener("gestureend", preventGesture);
        };
    }, []);

    return (
        <Routes>
            {/*<Route element={<Sell/>} path={"/"}/>*/}
            <Route element={<TableMaskan/>} path={"/"}/>
            <Route element={<Login/>} path={"/login"}/>
        </Routes>
    );
};

export default App;