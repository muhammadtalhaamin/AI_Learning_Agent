'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Brain, Book, Video, Sparkles, Award, ChevronRight, Github, Linkedin, Twitter, Star, CheckCircle, Users, MessageSquare, PenTool, Target } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const slideIn = {
  hidden: { x: -60, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1 }
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const reviews = [
    {
      name: "Sarah Johnson",
      role: "High School Student",
      image: "/sarah.png",
      review: "This AI tutor helped me improve my calculus grade from a C to an A. The step-by-step explanations are incredibly clear!",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Math Professor",
      image: "/chen.png",
      review: "An excellent tool for students. The way it breaks down complex problems is pedagogically sound and effective.",
      rating: 5
    },
    {
      name: "Emma Williams",
      role: "College Student",
      image: "/Emma.png",
      review: "I use this for my engineering calculations. It's like having a patient tutor available 24/7.",
      rating: 5
    }
  ];

  const howItWorks = [
    {
      icon: <PenTool className="w-8 h-8 text-blue-600" />,
      title: "Input Your Problem",
      description: "Type your math problem or upload a photo. Our AI can understand both typed and handwritten equations."
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "AI Analysis",
      description: "Our advanced AI breaks down the problem and identifies the best solution approach."
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: "Get Step-by-Step Solution",
      description: "Receive detailed explanations with each step clearly explained in simple terms."
    },
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "Practice & Master",
      description: "Get similar practice problems to reinforce your understanding and build confidence."
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Math Agent
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How it Works</Link>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.3 } }
            }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeIn}
              className="inline-block px-4 py-1 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-6"
            >
              AI-Powered Learning Platform
            </motion.div>
            <motion.h1
              variants={fadeIn}
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Master Math with AI Intelligence
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="text-xl text-gray-600 mb-8"
            >
              Experience personalized learning with our advanced AI tutor that breaks down complex math problems into simple, understandable steps.
            </motion.p>
            <motion.div
              variants={fadeIn}
              className="flex flex-col md:flex-row items-center justify-center gap-4"
            >
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  Start Learning Now <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } }
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "50K+", label: "Active Users" },
              { number: "1M+", label: "Problems Solved" },
              { number: "98%", label: "Success Rate" },
              { number: "4.9/5", label: "User Rating" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="text-center"
              >
                <h3 className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Four simple steps to master any math problem</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } }
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                variants={slideIn}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition relative">
  
                <div className="mb-4 ">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-600">Experience the future of learning with our cutting-edge features designed to enhance your understanding.</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Brain className="w-8 h-8 text-blue-600" />,
                title: "AI-Powered Analysis",
                description: "Get instant feedback and detailed explanations for any math problem."
              },
              {
                icon: <Video className="w-8 h-8 text-blue-600" />,
                title: "Interactive Learning",
                description: "Engage with visual demonstrations and step-by-step solutions."
              },
              {
                icon: <Brain className="w-8 h-8 text-blue-600" />,
                title: "Voice Interaction",
                description: "Speak naturally with our AI tutor for a conversational learning experience."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={slideIn}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-gray-600">Join thousands of satisfied students who have transformed their math learning journey</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <img src={review.image} alt={review.name} className="w-16 h-16 rounded-full" />
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg">{review.name}</h3>
                    <p className="text-gray-600">{review.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600">{review.review}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Subject Coverage Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Comprehensive Math Coverage</h2>
            <p className="text-gray-600">From basic arithmetic to advanced calculus, we've got you covered</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { subject: "Algebra", problems: "250K+" },
              { subject: "Calculus", problems: "180K+" },
              { subject: "Geometry", problems: "150K+" },
              { subject: "Statistics", problems: "120K+" },
              { subject: "Trigonometry", problems: "100K+" },
              { subject: "Linear Algebra", problems: "90K+" },
              { subject: "Number Theory", problems: "80K+" },
              { subject: "Probability", problems: "70K+" }
            ].map((subject, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-md text-center"
              >
                <h3 className="text-xl font-semibold mb-2">{subject.subject}</h3>
                <p className="text-blue-600 font-medium">{subject.problems} problems</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

       {/* Call to Action Section */}
       <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Excel in Mathematics?</h2>
            <p className="text-xl mb-8">Join thousands of students who are already experiencing the power of AI-assisted learning.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-gray-100 transition"
            >
              <Link href="/dashboard">
              Get Started for Free
              </Link>
            </motion.button>
          </motion.div>
        </div>
      </section>
      </div>
  );
}