import React from "react";
import { useSelector } from "react-redux";
import Header from "../common/header";
import Footer from "../common/footer";
import LoadingPage from "../common/loadingPage";

const AllPagesLayout = () => {
    const isLoading = useSelector((state: any) => state.loading.isLoading);
    return (
        <div className="app-shell w-full">
            <LoadingPage loading={isLoading} />
            <Header />
            <Footer />
        </div>
    )
};

export default AllPagesLayout;
