import React from "react";
import Embedded from "../templates/modelo site/src/Embedded";
import "../templates/modelo site/src/index.css";

const ModeloEditavel = () => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-4">Editor do Site Modelo</h1>
        <p className="text-muted-foreground mb-6">Visualização direta, pronta para edição futura.</p>
      </div>
      <Embedded />
    </div>
  );
};

export default ModeloEditavel;

