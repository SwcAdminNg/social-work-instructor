"use client";

export function ContactMap() {
  return (
    <section className="w-full h-[400px] md:h-[500px] lg:h-[600px] relative overflow-hidden">
      <iframe 
        src="https://maps.google.com/maps?cid=11551025152218255818&output=embed" 
        width="100%" 
        height="100%" 
        style={{ border: 0 }} 
        allowFullScreen={false} 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 w-full h-full"
      ></iframe>
      
      {/* Decorative inner shadow to blend the map edges */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
    </section>
  );
}
