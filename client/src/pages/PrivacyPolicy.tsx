import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 py-10">
      <div className="container mx-auto px-4 max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy for ClockedIn</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p>Welcome to ClockedIn ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our service.</p>
            <p className="mt-2">By using ClockedIn, you consent to the collection and use of information in accordance with this policy.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
            <p>We collect and process the following information:</p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Authentication information:</strong> When you sign in with Google, we receive your basic profile information (email address) for authentication purposes.</li>
              <li><strong>Calendar data:</strong> We request read-only access to your Google Calendar data to analyze your meeting patterns and generate statistics.</li>
              <li><strong>Usage data:</strong> We collect information about how you interact with our application to improve user experience.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
            <p>We use your data for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>To provide and maintain our service</li>
              <li>To analyze your calendar for meeting patterns, frequency, duration, and participation</li>
              <li>To generate statistics about your meeting habits</li>
              <li>To help you visualize how you spend your time in meetings</li>
              <li>To improve our service based on how users interact with it</li>
            </ul>
            <p className="mt-2"><strong>Important:</strong> We do not store raw calendar data on our servers permanently. We process this data to generate statistics and then cache these statistics temporarily to improve performance. Calendar data is never used for any purpose other than generating your personal meeting statistics.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data Retention</h2>
            <p>We retain your data as follows:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Authentication information is stored for as long as you maintain an account with us</li>
              <li>Processed meeting statistics are cached temporarily (typically for 5 minutes) to improve performance</li>
              <li>Usage data may be retained for up to 90 days to help us improve our service</li>
            </ul>
            <p className="mt-2">You can request deletion of your data at any time by contacting us.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">5. Data Sharing and Third Parties</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties. We may use third-party service providers to help us operate our service, but these providers have access to your information only to perform specific tasks on our behalf and are obligated to maintain confidentiality.</p>
            <p className="mt-2">Third-party services we use include:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Google (for authentication and calendar access)</li>
              <li>Vercel (for hosting our frontend application)</li>
              <li>Render (for hosting our backend services)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">6. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. However, no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">7. Your Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal data, including:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>The right to access your personal data</li>
              <li>The right to rectification of inaccurate data</li>
              <li>The right to erasure of your data</li>
              <li>The right to restrict processing of your data</li>
              <li>The right to data portability</li>
              <li>The right to object to processing of your data</li>
            </ul>
            <p className="mt-2">You can exercise these rights by contacting us. Additionally, you can revoke our access to your Google Calendar at any time through your <a href="https://myaccount.google.com/permissions" className="text-blue-600 hover:text-blue-800 underline">Google account settings</a>.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">8. Children's Privacy</h2>
            <p>Our service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">9. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date. We encourage you to review this Privacy Policy periodically for any changes.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
            <p className="mt-2 font-medium">Email: privacy@clockedin-app.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 