import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import Header from "../common/header";
import Footer from "../common/footer";
import LoadingPage from "../common/loadingPage";
import { Outlet } from "react-router-dom";

const AllPagesLayout = () => {
    const isLoading = useSelector(state => state.loading.isLoading);
    return (
        <div className="w-full">
            <LoadingPage loading={isLoading} />
            <Header />
            <main className="min-h-screen">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
};

export default AllPagesLayout;