import React from "react";
import Header from "../common/header";
import Footer from "../common/footer";

const AllPagesLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    )
};

export default AllPagesLayout;