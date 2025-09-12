import { motion } from 'framer-motion';
import { ArrowRightIcon, SparklesIcon, CubeIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary-400/20 to-primary-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Floating SVG Icons */}
      <motion.div
        className="absolute top-20 left-10 text-primary-400 opacity-60"
        animate={{
          y: [-10, 10, -10],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <CubeIcon className="w-8 h-8" />
      </motion.div>

      <motion.div
        className="absolute top-40 right-20 text-secondary-400 opacity-60"
        animate={{
          y: [10, -10, 10],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <SparklesIcon className="w-6 h-6" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 mb-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <SparklesIcon className="w-4 h-4 text-primary-500 mr-2" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Professional AI-Powered Platform
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            <span className="block">Cut. Glue.</span>
            <span className="block bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Build. Repeat.
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional AI-powered laser cutting platform that saves 10+ hours per week. Generate manufacturable designs in minutes, not hours.
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
              95% Success Rate
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
              Commercial License
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
              G-code Generation
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
              7-day Money Back
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <motion.a
              href="/pricing"
              className="btn btn-primary text-lg px-8 py-4 rounded-xl shadow-lg inline-flex items-center group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Start at $49/month
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.a>

            <motion.a
              href="/templates"
              className="btn btn-outline text-lg px-8 py-4 rounded-xl inline-flex items-center"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Browse Templates
            </motion.a>
          </div>

          {/* ROI Highlight */}
          <motion.div
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="text-green-800 dark:text-green-200 font-semibold mb-2">
              Break-even with just 1 design
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Manual design: 2-4 hours @ $50/hr = $200+ • CutGlueBuild: 2 minutes = 99% time savings
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-1">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pro Templates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-500 mb-1">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-1">2min</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Design Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-500 mb-1">$49</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Starting Price</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}