import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CookCard } from "./CookCard";
import { Loader2 } from "lucide-react";
import { cooksApi } from "../services/api";
import { Cook } from "../types";

// Use React Query to fetch top rated cooks

export const FeaturedCooks = () => {
  // Fetch top rated cooks from the database
  const { data: cooks, isLoading, isError } = useQuery({
    queryKey: ['cooks', 'featured'],
    queryFn: async () => {
      try {
        // Get all cooks and sort by rating on client-side
        const allCooks = await cooksApi.getAll();
        
        // If API returns empty array, try to handle gracefully
        if (!allCooks || allCooks.length === 0) {
          console.log('No cooks returned from API');
          return [];
        }
        
        return allCooks
          .filter(cook => cook.averageRating && cook.averageRating > 0) // Only filter by rating, not by active meals
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 3);
      } catch (error) {
        console.error('Failed to fetch featured cooks:', error);
        return [];
      }
    },
    placeholderData: [],
    retry: 2, // Retry failed requests twice
    retryDelay: 1000 // Wait 1 second between retries
  });

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-primary font-semibold mb-2">Top Rated</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Home Cooks
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our most loved cooks serving authentic homemade meals in your neighborhood
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">Unable to load featured cooks</p>
          </div>
        ) : cooks && cooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cooks.map((cook) => (
              <CookCard 
                key={cook._id}
                id={cook._id}
                name={cook.name}
                image={cook.kitchenImageUrls?.[0] || ''}
                rating={cook.averageRating || 0}
                reviews={cook.ratingCount || 0}
                location={cook.location?.neighborhood || 'Unknown location'}
                todaysDish={cook.topRatedMeal?.name || 'No top dish yet'}
                dishImage={cook.topRatedMeal?.image || ''}
                price={cook.topRatedMeal?.price || 0}
                calories={cook.topRatedMeal?.calories || 0}
                verified={true}
                topRated={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">No cooks available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
};
