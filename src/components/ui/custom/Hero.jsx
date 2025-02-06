import React from 'react';
import { Button } from '../button';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <div
      className="bg-[url('/background.jpg')] bg-cover bg-center h-screen w-full flex flex-col items-center justify-center"
      style={{ margin: 0, padding: 0 }}
    >
      <h2 className="font-extrabold text-[40px] md:text-[50px] text-center text-white flex flex-col gap-2">
        <span className="font-extrabold text-[#f56551] text-4xl md:text-5xl">
          Discover Your Next Adventure with AI
        </span>
        <span className="font-bold text-[20px] md:text-[24px] text-gray-200">
          Trip planner with personalized itineraries, tickets, hotels, and much more
        </span>
        <p className="text-sm md:text-base text-gray-300 text-center mt-3 max-w-3xl mx-auto">
          Your personal trip planner and curator, creating custom itineraries tailored to your interests, style, and budget.
        </p>
        <Link to="/create-trip" className="mt-6">
          <Button className="text-white bg-[#f56551] hover:bg-[#e53e3e] transition duration-300 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105">
            Get Started for Free!
          </Button>
        </Link>
      </h2>
    </div>
  );
}

export default Hero;