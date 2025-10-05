import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MapPin, Star, ShieldCheck, Flame } from "lucide-react";

interface CookCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  todaysDish: string;
  dishImage: string;
  price: number;
  calories?: number;
  verified?: boolean;
  distance?: number; // Distance in km
  topRated?: boolean;
}

export const CookCard = ({
  id,
  name,
  image,
  rating,
  reviews,
  location,
  todaysDish,
  dishImage,
  price,
  calories = 350,
  verified = true,
  distance,
  topRated = false,
}: CookCardProps) => {
  // Use a default image if the dish image is not available
  const defaultDishImage = 'https://res.cloudinary.com/dpezwdjkk/image/upload/v1718612278/homebite/kitchens/placeholder_dish_ghnefh.jpg';
  const defaultCookImage = 'https://res.cloudinary.com/dpezwdjkk/image/upload/v1718612278/homebite/kitchens/placeholder_cook_bbe8jd.jpg';

  return (
    <Card className={`group overflow-hidden border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${topRated ? 'ring-2 ring-primary/20' : ''}`}>
      <CardContent className="p-0">
        {/* Dish Image - Only show if there's a valid dish */}
        {todaysDish && todaysDish !== 'No top dish yet' && dishImage && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={dishImage}
              alt={todaysDish}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Hide the image container if it fails to load
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
            {price > 0 && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-background/95 text-foreground hover:bg-background border-0 text-sm font-semibold px-2 py-1">
                  ₹{price}
                </Badge>
              </div>
            )}
            {calories > 0 && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="gap-1 text-sm px-2 py-1">
                  <Flame className="h-4 w-4 text-primary" />
                  {calories} cal
                </Badge>
              </div>
            )}
            {topRated && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-500 border-0 gap-1 text-xs px-2 py-1">
                  <Star className="h-3 w-3 fill-current" />
                  Top Rated
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Cook Info */}
        <div className="p-4 space-y-3">
          {/* Badges Row */}
          <div className="flex items-center justify-between">
            {/* Verified Badge */}
            {verified && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent border-0 gap-1 text-xs w-fit">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
            
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
              <span className="text-sm font-bold text-foreground">
                {rating > 0 ? rating.toFixed(1) : 'New'}
              </span>
              {reviews > 0 && (
                <span className="text-xs text-muted-foreground">({reviews})</span>
              )}
            </div>
          </div>

          {/* Cook Details */}
          <div className="flex items-center gap-3">
            <img
              src={image || defaultCookImage}
              alt={name}
              className="h-16 w-16 rounded-full object-cover border-2 border-border flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = defaultCookImage;
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate text-lg">{name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{location}</span>
                {distance !== undefined && distance > 0 && (
                  <span className="text-sm font-medium text-primary flex-shrink-0">
                    • {distance.toFixed(1)} km
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Dish name if available */}
          {todaysDish && todaysDish !== 'No top dish yet' && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <span className="text-base font-semibold text-primary truncate flex-1">{todaysDish}</span>
              <span className="text-sm text-muted-foreground">Top Dish</span>
            </div>
          )}

          {/* Action Button */}
          <Button variant="default" size="sm" asChild className="w-full h-10 text-sm">
            <Link to={`/cooks/${id}`}>View Menu</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
