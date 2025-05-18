import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const generateMockCompletionData = () => {
  // Generate last 12 months of data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  return Array(12).fill(0).map((_, i) => {
    const month = (currentMonth - 11 + i + 12) % 12; // Go back 11 months and move forward
    return {
      name: monthNames[month],
      CompletionRate: Math.min(Math.round(Math.random() * 40 + 60), 100), // Between 60-100%
      AssessmentsCount: Math.floor(Math.random() * 40 + 10), // Between 10-50
    };
  });
};

const CompletionRateChart = () => {
  // In a real app, this data would come from the API
  const data = generateMockCompletionData();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" domain={[0, 100]} label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 50]} label={{ value: 'Assessment Count', angle: 90, position: 'insideRight' }} />
        <Tooltip />
        <Legend />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="CompletionRate" 
          stroke="#8884d8" 
          activeDot={{ r: 8 }} 
          name="Completion Rate (%)"
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="AssessmentsCount" 
          stroke="#82ca9d" 
          name="Number of Assessments"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CompletionRateChart;