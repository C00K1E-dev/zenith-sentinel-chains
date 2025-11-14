import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, uniqueEmails: 0, uniqueTelegrams: 0 });

  const fetchRegistrations = async () => {
    if (!adminKey) {
      alert('Please enter admin key');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/airdrop-registrations?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.data.registrations);
        setStats({
          total: data.data.total,
          uniqueEmails: data.data.uniqueEmails,
          uniqueTelegrams: data.data.uniqueTelegrams,
        });
        setIsAuthenticated(true);
      } else {
        alert('Invalid admin key or error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error fetching registrations. Database may not be set up yet.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Wallet', 'X Handle', 'Telegram', 'Email', 'Registered'];
    const rows = registrations.map(r => [
      r.wallet,
      r.x,
      r.telegram,
      r.email,
      new Date(r.registered).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airdrop-registrations-${Date.now()}.csv`;
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && fetchRegistrations()}
            />
            <Button onClick={fetchRegistrations} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Airdrop Registration Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Total Registrations</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Unique Emails</p>
            <p className="text-3xl font-bold">{stats.uniqueEmails}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Unique Telegrams</p>
            <p className="text-3xl font-bold">{stats.uniqueTelegrams}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <Button onClick={fetchRegistrations} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
        <Button onClick={downloadCSV}>
          <Download size={16} className="mr-2" />
          Download CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Wallet</th>
                  <th className="text-left py-2 px-4">X Handle</th>
                  <th className="text-left py-2 px-4">Telegram</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-xs">{reg.wallet.slice(0, 10)}...</td>
                    <td className="py-2 px-4">{reg.x}</td>
                    <td className="py-2 px-4">{reg.telegram}</td>
                    <td className="py-2 px-4">{reg.email}</td>
                    <td className="py-2 px-4 text-gray-600">
                      {new Date(reg.registered).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
