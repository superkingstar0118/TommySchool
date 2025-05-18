import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const generateMockStudentData = () => {
  const students = [
    "Emma Thompson",
    "Liam Johnson",
    "Olivia Martinez",
    "Noah Williams",
    "Ava Brown",
    "Ethan Davis",
    "Sophia Wilson",
    "Mason Anderson",
    "Isabella Thomas",
    "Logan Jackson"
  ];
  
  return students.map(name => {
    return {
      name: name,
      Critical_Thinking: Math.random() * 3 + 2, // Between 2-5
      Communication: Math.random() * 3 + 2,
      Presentation: Math.random() * 3 + 2,
      Writing: Math.random() * 3 + 2,
    }
  });
};

const StudentsPerformanceChart = () => {
  // In a real app, this data would come from the API
  const data = generateMockStudentData();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 100,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 5]} 
          label={{ 
            value: 'Score (0-5)', 
            angle: -90, 
            position: 'insideLeft' 
          }} 
        />
        <Tooltip />
        <Legend wrapperStyle={{ paddingTop: 20 }} />
        <Bar dataKey="Critical_Thinking" fill="#8884d8" name="Critical Thinking" />
        <Bar dataKey="Communication" fill="#82ca9d" name="Communication" />
        <Bar dataKey="Presentation" fill="#ffc658" name="Presentation" />
        <Bar dataKey="Writing" fill="#ff8042" name="Writing" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StudentsPerformanceChart;