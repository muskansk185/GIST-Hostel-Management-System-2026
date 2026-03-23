import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wifi, 
  ShieldCheck, 
  Coffee, 
  Clock, 
  Map, 
  Phone, 
  Mail, 
  MapPin,
  ArrowRight,
  Utensils,
  BookOpen,
  GraduationCap
} from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md sm:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg">
            <GraduationCap size={24} />
          </div>
          <span className="hidden sm:block text-lg font-bold tracking-tight text-slate-900">
            Geethanjali Institute of Science and Technology
          </span>
          <span className="sm:hidden text-lg font-bold tracking-tight text-slate-900">
            GIST
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Home</Link>
          <a href="#facilities" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Facilities</a>
          <a href="/docs/floor-plan.pdf" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Floor Plan</a>
          <a href="#contact" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Contact</a>
        </div>
        <div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Hostel Management System
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Experience seamless hostel management with our comprehensive digital platform. 
                From room allocation to mess schedules, we make campus life easier for students, 
                parents, and administrators.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/student/register"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
                >
                  Student Register
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 transition-all hover:bg-indigo-50"
                >
                  Student Login
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
                >
                  Admin Login
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-2xl bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-900/10">
                <img
                  src="/images/hostel.jpg"
                  alt="Campus Life"
                  className="w-full h-full rounded-xl object-cover shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute -bottom-6 -left-6 rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Security Status</p>
                      <p className="text-lg font-bold text-slate-900">24/7 Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hostel Overview & Facilities */}
      <section id="facilities" className="bg-slate-50 px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Premium Facilities</h2>
            <p className="mt-4 text-lg text-slate-600">Everything you need for a comfortable stay across our 4 major hostel blocks.</p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Wifi className="h-6 w-6" />, title: 'High-Speed WiFi', desc: 'Enterprise-grade connectivity across all blocks' },
              { icon: <Coffee className="h-6 w-6" />, title: 'Cafeteria', desc: '24/7 access to snacks and beverages' },
              { icon: <BookOpen className="h-6 w-6" />, title: 'Study Rooms', desc: 'Quiet, air-conditioned spaces for focused learning' },
              { icon: <ShieldCheck className="h-6 w-6" />, title: 'Smart Security', desc: 'Biometric access and CCTV surveillance' },
            ].map((facility, idx) => (
              <div key={idx} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {facility.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{facility.title}</h3>
                <p className="text-sm text-slate-600">{facility.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floor Plan Preview */}
      <section className="bg-white px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                <img 
                  src="https://picsum.photos/seed/blueprint/800/800" 
                  alt="Hostel Floor Plan" 
                  className="h-full w-full object-cover opacity-90 mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
                <Map className="h-4 w-4" />
                <span>Interactive Layouts</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Intelligent Space Design</h2>
              <p className="mt-6 text-lg text-slate-600">
                Our hostels are designed to foster both community and privacy. View real-time room availability, 
                locate amenities, and choose your preferred block through our interactive floor plans.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Single, double, and triple occupancy options',
                  'Attached washrooms in premium blocks',
                  'Common lounges on every floor',
                  'Dedicated laundry rooms'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                    {item}
                  </li>
                ))}
              </ul>
              {/* <div className="mt-10">
                <Link
                  to="/floor-plan"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-indigo-700"
                >
                  View Interactive Floor Plan
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Mess Facilities */}
      <section className="bg-slate-900 px-6 py-24 text-white sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dining Experience</h2>
            <p className="mt-4 text-lg text-slate-400">Nutritious, hygienic, and diverse meal options prepared daily.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10">
                <div className="border-b border-white/10 bg-slate-800/50 px-6 py-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Utensils className="h-5 w-5 text-indigo-400" />
                    Daily Schedule
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { meal: 'Breakfast', time: '07:30 AM - 09:00 AM', menu: 'Continental & Local Options' },
                    { meal: 'Lunch', time: '12:30 PM - 02:00 PM', menu: 'Full Course Meal' },
                    { meal: 'Snacks', time: '04:30 PM - 05:30 PM', menu: 'Tea, Coffee & Light Bites' },
                    { meal: 'Dinner', time: '07:30 PM - 09:00 PM', menu: 'Varied Daily Menu' },
                  ].map((schedule, idx) => (
                    <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/80 transition-colors">
                      <div>
                        <p className="font-medium text-white">{schedule.meal}</p>
                        <p className="text-sm text-slate-400">{schedule.menu}</p>
                      </div>
                      <div className="rounded-full bg-slate-700 px-3 py-1 text-sm font-medium text-slate-300">
                        {schedule.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="col-span-1 space-y-6">
              <div className="rounded-2xl bg-indigo-600 p-8">
                <h3 className="mb-4 text-xl font-bold">Special Dietary Needs?</h3>
                <p className="mb-6 text-indigo-100">
                  We cater to various dietary requirements including vegetarian, vegan, and specific allergy-friendly meals.
                </p>
                <a href="/docs/mess-menu.pdf" target="_blank" rel="noopener noreferrer" className="block text-center w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  View Full Menu
                </a>
              </div>
              <div className="rounded-2xl bg-slate-800 p-8 ring-1 ring-white/10">
                <h3 className="mb-2 font-semibold">Mess Committee</h3>
                <p className="text-sm text-slate-400">
                  Menus are decided bi-weekly by the student mess committee to ensure variety and quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Curfew */}
      <section className="bg-white px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Rules & Regulations</h2>
              <p className="mt-4 text-lg text-slate-600">
                To maintain a safe and conducive environment for all residents, we strictly enforce our community guidelines.
              </p>
              
              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Curfew Timings</h3>
                    <p className="mt-1 text-slate-600">Main gates close at 10:00 PM sharp. Late entries require prior digital approval from the Warden via the portal.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Visitor Policy</h3>
                    <p className="mt-1 text-slate-600">Visitors are allowed only in designated visitor lounges between 4:00 PM and 7:00 PM.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-200 sm:p-10">
              <h3 className="mb-6 text-xl font-bold text-slate-900">Leave Application Process</h3>
              <ol className="relative border-l border-slate-300 ml-3 space-y-6">
                <li className="pl-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-4 ring-slate-50">
                    <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  </span>
                  <h4 className="font-semibold text-slate-900">Submit Request</h4>
                  <p className="text-sm text-slate-600 mt-1">Apply via the student portal at least 24 hours in advance.</p>
                </li>
                <li className="pl-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-4 ring-slate-50">
                    <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  </span>
                  <h4 className="font-semibold text-slate-900">Parental Consent</h4>
                  <p className="text-sm text-slate-600 mt-1">Parents receive an SMS/Email to approve the leave digitally.</p>
                </li>
                <li className="pl-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-4 ring-slate-50">
                    <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  </span>
                  <h4 className="font-semibold text-slate-900">Warden Approval</h4>
                  <p className="text-sm text-slate-600 mt-1">Final approval is granted by the respective block warden.</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-slate-50 px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-indigo-900 px-6 py-16 sm:p-16 lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Need Assistance?</h2>
              <p className="mt-4 text-lg text-indigo-200">
                Our administration team is available round the clock to help you with any queries.
              </p>
            </div>
            
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-0 lg:w-1/2 lg:pl-10">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
                <Phone className="mb-4 h-6 w-6 text-indigo-300" />
                <h3 className="font-semibold text-white">Chief Warden Office</h3>
                <p className="mt-2 text-sm text-indigo-200">+1 (555) 123-4567</p>
                <p className="text-sm text-indigo-200">Ext: 401</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
                <Mail className="mb-4 h-6 w-6 text-indigo-300" />
                <h3 className="font-semibold text-white">Email Support</h3>
                <p className="mt-2 text-sm text-indigo-200">hostels@university.edu</p>
                <p className="text-sm text-indigo-200">support@hostelms.com</p>
              </div>
              <div className="col-span-full rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
                <MapPin className="mb-4 h-6 w-6 text-indigo-300" />
                <h3 className="font-semibold text-white">Campus Address</h3>
                <p className="mt-2 text-sm text-indigo-200">
                  Hostel Administration Block, University Campus,<br />
                  123 Education Boulevard, Tech City, TC 12345
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 text-center border-t border-slate-200">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Geethanjali Institute of Science and Technology. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
