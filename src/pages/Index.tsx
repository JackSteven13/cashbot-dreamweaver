
import React from "react";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Feature from "@/components/Feature";
import Footer from "@/components/Footer";

const features = [
  {
    title: "Automatisation Complète",
    description:
      "Notre système intelligent fonctionne 24h/24 pour maximiser vos gains, même pendant votre sommeil.",
    icon: "💰",
  },
  {
    title: "Analyses en Temps Réel",
    description:
      "Visualisez vos performances et ajustez votre stratégie grâce à nos tableaux de bord détaillés.",
    icon: "📊",
  },
  {
    title: "Sécurité Maximale",
    description:
      "Protection de vos données et de vos gains avec notre infrastructure sécurisée de niveau bancaire.",
    icon: "🔒",
  },
  {
    title: "Support Personnalisé",
    description:
      "Notre équipe d'experts est disponible pour vous accompagner et optimiser votre expérience.",
    icon: "👨‍💻",
  },
];

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">
                Pourquoi choisir CashBot?
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Une solution complète pour générer des revenus passifs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Feature
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
