import { useLocation } from "react-router-dom";
import Header from "../common/header";
import Footer from "../common/footer";

const AllPagesLayout = () => {
    const isAdminRoute = useLocation().pathname.startsWith("/admin");
    return (
        <div className="app-shell w-full">
            <Header />
            {!isAdminRoute && <Footer />}
        </div>
    )
};

export default AllPagesLayout;
