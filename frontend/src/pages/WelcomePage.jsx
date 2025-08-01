import GradImg from "../assets/grad.png";
import NiggaImg from "../assets/nigga.png";
import WhiteImg from "../assets/white.png";
import AvatarsImg from "../assets/avatars.png";
import { useNavigate } from "react-router-dom";
import { MENTEE_PATH } from "../routes/path";

const WelcomePage = () => {
  const navigate = useNavigate();
  const handleButton = () => {
    navigate(MENTEE_PATH.HOME);
  };

  return (
    <section className="bg-white h-screen py-16 px-6 md:px-16 flex flex-col md:flex-row gap-10 items-center justify-center">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Unlock Your Potential <br /> with{" "}
          <span className="text-blue-600">MentorMe</span>
        </h1>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Ready to level up? With MentorMe, you’re just a click away from
          connecting with awesome mentors who’ve been there, done that, and are
          here to help you crush your goals.
        </p>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Explore different fields, chat directly with real experts, and book
          one-on-one sessions—online or in person. Whether you’re figuring out
          your next career move, need study tips, or just want some honest
          advice, MentorMe is your shortcut to real-world wisdom and personal
          growth.
        </p>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Don’t just dream it—make it happen. Your journey starts here!
        </p>
        <button
          onClick={handleButton}
          className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition "
        >
          Get Started
        </button>
      </div>

      <div className="relative w-full flex justify-center items-center mt-10 md:mt-0">
        <div className="relative w-[400px] h-[480px]">
          <div className="absolute left-60 transform -translate-x-1/2 top-0 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-yellow-300">
            <img
              src={NiggaImg}
              alt="Student"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute bottom-20 right-60 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-green-400">
            <img
              src={GradImg}
              alt="Grad"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full overflow-hidden shadow-xl bg-blue-300">
            <img
              src={WhiteImg}
              alt="Teen"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-xl shadow-lg flex flex-col items-center space-y-2">
          <img src={AvatarsImg} alt="Community" className="w-28 h-auto" />
          <span className="text-lg font-medium text-gray-800">
            Join our community
          </span>
        </div>
      </div>
    </section>
  );
};

export default WelcomePage;