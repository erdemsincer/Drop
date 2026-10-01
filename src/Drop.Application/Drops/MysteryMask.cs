using Drop.Application.Businesses.Profile;
using Drop.Application.Drops.GetNearbyDrops;
using Drop.Application.Drops.GetUpcomingDrops;
using Drop.Application.Features.Drops.GetDropDetail;
using Drop.Domain.Common;

namespace Drop.Application.Drops;

/// <summary>
/// Hides what a locked mystery drop is: title, business, photo and price
/// never leave the server until the customer stands close enough. Only the
/// place (so it can be found), the hint, the clock and the spots remain.
/// </summary>
public static class MysteryMask
{
    public const string Title = "Gizli Drop";
    public const string Business = "Gizli işletme";
    public const string Branch = "Sürpriz";
    public const string DefaultHint = "Yakınında bir sürpriz var. Yaklaş ve kutuyu aç!";

    public static bool IsWithinReach(double latitude, double longitude, double? atLatitude, double? atLongitude) =>
        atLatitude is { } lat && atLongitude is { } lng
        && Geo.DistanceMeters(latitude, longitude, lat, lng) <= Domain.Drops.Drop.MysteryUnlockMeters;

    public static NearbyDropResponse Apply(NearbyDropResponse drop) =>
        !drop.IsMystery || drop.DistanceMeters <= Domain.Drops.Drop.MysteryUnlockMeters
            ? drop
            : drop with
            {
                IsLocked = true,
                Title = Title,
                Description = drop.Hint ?? DefaultHint,
                BusinessName = Business,
                BranchName = Branch,
                MinimumSpend = null,
                Category = "Other",
                OriginalPrice = null,
                DealPrice = null,
                PhotoId = null,
                BusinessRating = null,
                BusinessRatingCount = 0,
            };

    public static DropDetailResponse Apply(DropDetailResponse drop, double? latitude, double? longitude)
    {
        var distance = latitude is { } lat && longitude is { } lng
            ? (int)Math.Round(Geo.DistanceMeters(drop.Latitude, drop.Longitude, lat, lng))
            : (int?)null;

        var withDistance = drop with { DistanceMeters = distance };

        return !drop.IsMystery || distance <= Domain.Drops.Drop.MysteryUnlockMeters
            ? withDistance
            : withDistance with
            {
                IsLocked = true,
                // The business page would give it away.
                BusinessId = Guid.Empty,
                BusinessName = Business,
                BranchName = Branch,
                Title = Title,
                Description = drop.Hint ?? DefaultHint,
                MinimumSpend = null,
                Category = "Other",
                OriginalPrice = null,
                DealPrice = null,
                PhotoId = null,
                BusinessRating = null,
                BusinessRatingCount = 0,
            };
    }

    /// <summary>Upcoming mystery drops stay sealed: they can't be opened before they start anyway.</summary>
    public static UpcomingDropResponse Apply(UpcomingDropResponse drop) =>
        !drop.IsMystery
            ? drop
            : drop with
            {
                BusinessName = Business,
                BranchName = Branch,
                Title = Title,
                Category = "Other",
                OriginalPrice = null,
                DealPrice = null,
                PhotoId = null,
            };

    /// <summary>On the business page the business is known, but the deal itself stays a surprise.</summary>
    public static BusinessProfileDrop Apply(BusinessProfileDrop drop) =>
        !drop.IsMystery
            ? drop
            : drop with { Title = Title, Category = "Other", OriginalPrice = null, DealPrice = null, PhotoId = null };
}
