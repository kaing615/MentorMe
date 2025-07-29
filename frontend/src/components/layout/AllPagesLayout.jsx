import React from "react";
import Header from "../common/header";
import Footer from "../common/footer";
import { Outlet } from "react-router-dom";

const AllPagesLayout = ({ children }) => {
    return (
        <div className="w-full">
            <Header />
            <Footer />
        </div>
    )
};

export default AllPagesLayout;