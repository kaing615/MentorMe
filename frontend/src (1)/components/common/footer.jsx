import React from "react";
import facebooklogo from "../../assets/facebook.png";
import githublogo from "../../assets/github.png";
import googlelogo from "../../assets/google.png";
import twitterlogo from "../../assets/twitter.png";
import microsoftlogo from "../../assets/microsoft.png";

const Footer = () => {
  return (
    <footer className="w-full bg-blue-900 text-white mt-12 py-8 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start justify-between">
        <div>
          <div className="font-bold text-lg mb-2">MentorMe</div>
          <p className="text-sm text-gray-300 mb-2">
            Empowering growth through real connections and personalized
            mentoring.
          </p>
          <p className="text-sm text-gray-300 mb-2">
            MentorMe is a leading mentorship platform designed to help you
            unlock your full potential through one-on-one guidance from
            experienced mentors across a wide range of fields.
          </p>
          <p className="text-sm text-gray-300">
            We make it easy and affordable for learners to find the right
            mentor, book flexible sessions, chat, and get honest advice that
            truly fits their goals. With MentorMe, personal growth and career
            development are just one connection away!
          </p>
        </div>
        <div>
          <div className="font-bold mb-2">Get Help</div>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>
              <a href="#contact" className="hover:underline">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#articles" className="hover:underline">
                Latest Articles
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline">
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">Programs</div>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>Art & Design</li>
            <li>Business</li>
            <li>IT & Software</li>
            <li>Languages</li>
            <li>Programming</li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">Contact Us</div>
          <p className="text-sm text-gray-300">
            <strong>Address:</strong> [Your Address Here]
          </p>
          <p className="text-sm text-gray-300">
            <strong>Tel:</strong> [Your Phone Number Here]
          </p>
          <p className="text-sm text-gray-300">
            <strong>Mail:</strong> [Your Email Here]
          </p>
          <div className="flex gap-2 mt-2">
            <a href="https://facebook.com">
              <div className="bg-white rounded-full flex items-center justify-center w-10 h-10">
                <img src={facebooklogo} alt="Facebook" className="w-6 h-6" />
              </div>
            </a>
            <a href="https://github.com">
              <div className="bg-white rounded-full flex items-center justify-center w-10 h-10">
                <img src={githublogo} alt="GitHub" className="w-6 h-6" />
              </div>
            </a>
            <a href="https://google.com">
              <div className="bg-white rounded-full flex items-center justify-center w-10 h-10">
                <img src={googlelogo} alt="Google" className="w-6 h-6" />
              </div>
            </a>
            <a href="https://yourwebsite.com">
              <div className="bg-white rounded-full flex items-center justify-center w-10 h-10">
                <img src={twitterlogo} alt="Your Website" className="w-6 h-6" />
              </div>
            </a>
            <a href="https://microsoft.com">
              <div className="bg-white rounded-full flex items-center justify-center w-10 h-10">
                <img src={microsoftlogo} alt="Microsoft" className="w-6 h-6" />
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-8">
        © 2025 MentorMe. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
