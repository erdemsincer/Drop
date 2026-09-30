namespace Drop.Domain.Drops;

/// <summary>What kind of place/offer a drop is; drives the customer feed filter.</summary>
public enum DropCategory
{
    Other = 0,
    Food = 1,
    Coffee = 2,
    Dessert = 3,
    Drinks = 4,
    Beauty = 5,
    Shopping = 6,
    Entertainment = 7
}
