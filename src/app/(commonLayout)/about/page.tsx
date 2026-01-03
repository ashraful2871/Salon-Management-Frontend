export default function AboutPage() {
  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "👩‍💼",
      bio: "10+ years of experience in the beauty industry",
    },
    {
      name: "Michael Chen",
      role: "Chief Technology Officer",
      image: "👨‍💻",
      bio: "Expert in building scalable platforms",
    },
    {
      name: "Emily Davis",
      role: "Head of Customer Success",
      image: "👩‍💼",
      bio: "Passionate about customer satisfaction",
    },
    {
      name: "David Wilson",
      role: "Marketing Director",
      image: "👨‍💼",
      bio: "Creative strategist with proven results",
    },
  ];

  const values = [
    {
      title: "Quality First",
      description: "We partner only with top-rated salons that meet our high standards",
      icon: "⭐",
    },
    {
      title: "Customer Focus",
      description: "Your satisfaction and experience are our top priorities",
      icon: "❤️",
    },
    {
      title: "Innovation",
      description: "Constantly improving our platform with the latest technology",
      icon: "🚀",
    },
    {
      title: "Trust & Safety",
      description: "Verified salons and secure booking process for peace of mind",
      icon: "🔒",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About Stylish Salon
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            We're on a mission to make beauty services accessible, convenient, and delightful for everyone
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, Stylish Salon was born out of a simple frustration: finding and booking quality salon appointments was unnecessarily complicated. We knew there had to be a better way.
                </p>
                <p>
                  Today, we've grown into a platform that connects thousands of customers with hundreds of verified salons across the country. Our platform has facilitated over 200,000 bookings, helping people look and feel their best.
                </p>
                <p>
                  We're proud to be changing the way people discover and book beauty services, making the process seamless, transparent, and enjoyable.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-12 text-center">
              <div className="text-8xl mb-4">💇‍♀️</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Transforming Beauty Services
              </h3>
              <p className="text-gray-600">
                One appointment at a time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate professionals dedicated to your beauty experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-purple-600 font-medium mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Partner Salons</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-purple-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">200K+</div>
              <div className="text-purple-100">Bookings Made</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8★</div>
              <div className="text-purple-100">Average Rating</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
