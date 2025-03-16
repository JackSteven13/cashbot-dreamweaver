
const BackgroundElements = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-0 right-0 -z-10 overflow-hidden">
        <div className="absolute h-[600px] w-[600px] rounded-full top-[-300px] right-[-200px] bg-gradient-to-b from-blue-100/30 to-blue-200/30 blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 -z-10 overflow-hidden">
        <div className="absolute h-[600px] w-[600px] rounded-full bottom-[-300px] left-[-200px] bg-gradient-to-t from-slate-100/30 to-blue-100/30 blur-3xl"></div>
      </div>
    </div>
  );
};

export default BackgroundElements;
