import React from "react";
import Header from "../common/header";
import Footer from "../common/footer";
import { Outlet } from "react-router-dom";

const AllPagesLayout = () => {
    return (
        <div className="w-full">
            <Header />
            <Outlet />
            <Footer />
        </div>
    )
};

export default AllPagesLayout;