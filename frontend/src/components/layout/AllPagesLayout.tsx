import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Header from "../common/header";
import Footer from "../common/footer";
import LoadingPage from "../common/loadingPage";

const AllPagesLayout = () => {
    const isAdminRoute = useLocation().pathname.startsWith("/admin");
    const isLoading = useSelector((state: any) => state.loading.isLoading);
    return (
        <div className="app-shell w-full">
            <LoadingPage loading={isLoading} />
            <Header />
            {!isAdminRoute && <Footer />}
        </div>
    )
};

export default AllPagesLayout;
