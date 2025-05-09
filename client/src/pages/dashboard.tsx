import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Globe, UserPlus } from "lucide-react";
import { Helmet } from 'react-helmet';

export default function Dashboard() {
  const { userData } = useAuth();
  
  // Format the createdAt timestamp or use fallback
  const formattedCreatedAt = userData?.createdAt 
    ? format(new Date(userData.createdAt.toDate()), 'MMMM yyyy')
    : 'Recent';

  return (
    <>
      <Helmet>
        <title>Dashboard - NextAuth</title>
        <meta name="description" content="Welcome to your NextAuth dashboard. View your account stats and recent activity." />
      </Helmet>
      <DashboardLayout title="Dashboard" contentId="dashboard-content">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome back, <span className="font-semibold">{userData?.displayName}</span>!
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>You've successfully signed in to your NextAuth account.</p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Stat Card 1 */}
          <Card>
            <CardContent className="pt-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Account Created
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {formattedCreatedAt}
                </dd>
              </dl>
            </CardContent>
          </Card>
          
          {/* Stat Card 2 */}
          <Card>
            <CardContent className="pt-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Security Status
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-emerald-600">
                  Protected
                </dd>
              </dl>
            </CardContent>
          </Card>
          
          {/* Stat Card 3 */}
          <Card>
            <CardContent className="pt-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Account Type
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  Standard
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary truncate">
                      Signed in successfully
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Just now
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <Globe className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        Browser on Device
                      </p>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary truncate">
                      Account created
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {formattedCreatedAt}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <UserPlus className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        New account
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
