import { Mail, Phone } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>

      {/* Contact */}
      <div className="bg-slate-800 p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Contact Support</h2>

        <div className="flex items-center gap-3 mb-2">
          <Mail size={18} />
          <span>support@cybershield.com</span>
        </div>

        <div className="flex items-center gap-3">
          <Phone size={18} />
          <span>+91 XXXXX XXXXX</span>
        </div>

        <p className="text-gray-400 mt-3">
          Our support team usually replies within 24 hours.
        </p>
      </div>

      {/* FAQ */}
      <div className="bg-slate-800 p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Common Questions</h2>

        <p className="mb-2"><b>How long does a scan take?</b></p>
        <p className="text-gray-400 mb-4">Most scans complete within 10-30 seconds.</p>

        <p className="mb-2"><b>Why did my scan fail?</b></p>
        <p className="text-gray-400">
          Some websites block automated scanners. Try again or check your URL.
        </p>
      </div>

      {/* Report Explanation */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-3">Understanding Security Reports</h2>

        <ul className="text-gray-300 list-disc pl-5">
          <li>Critical → Immediate security issue</li>
          <li>High → Major vulnerability</li>
          <li>Medium → Recommended fix</li>
          <li>Low → Minor improvement</li>
        </ul>
      </div>

    </div>
  );
}