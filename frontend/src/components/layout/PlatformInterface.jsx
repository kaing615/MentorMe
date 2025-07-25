import React from 'react';
import Header from '../common/header';
import Footer from '../common/footer';
import { Outlet } from 'react-router-dom';

const PlatformInterface = () => {
    return (
        <div className="w-full">
            <Header />
            <Footer />
        </div>
    );
}

export default PlatformInterface;