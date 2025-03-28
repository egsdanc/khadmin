import { useEffect, useRef } from "react";

const OdemeYapIyzico = () => {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkoutFormContent = localStorage.getItem("checkoutForm");

    if (checkoutFormContent && formRef.current) {
      formRef.current.innerHTML = checkoutFormContent;

      // Script etiketlerini tekrar çalıştır
      const scripts = formRef.current.getElementsByTagName("script");
      Array.from(scripts).forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.innerHTML = oldScript.innerHTML;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Ödeme Sayfası</h2>
      <div ref={formRef} id="iyzipay-checkout-form" className="border p-4"></div>
    </div>
  );
};

export default OdemeYapIyzico;
